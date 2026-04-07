#!/usr/bin/env python3
"""
Seamless ping-pong loop video generator.
Vytvoří video: forward -> reverse -> forward -> reverse -> ... do cílové délky.

Opravy oproti předchozí verzi:
  - Žádné duplikátní framy na spojích (select filter trimuje poslední frame každého segmentu)
  - Zachovává původní FPS místo hardcoded 30
  - Posix cesty v concat souborech (Windows kompatibilita)
  - Spolehlivější detekce délky (format > stream fallback)
  - --quality CLI argument (CRF)
  - -movflags +faststart pro web delivery
  - --xfade: crossfade dissolve na každém přechodu fwd↔rev (plynulý obrat)

Usage:
    python loop.py input.mp4
    python loop.py input.mp4 output.mp4 --duration 60 --quality 20
    python loop.py input.mp4 output.mp4 --duration 60 --xfade 0.5
"""

import math
import subprocess
import sys
import tempfile
import argparse
from pathlib import Path

# Windows: vynutí UTF-8 výstup bez ohledu na nastavení konzole
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def get_video_info(path: str) -> tuple:
    """Vrátí (duration, fps_str, fps, frame_count, has_audio)."""

    # Duration: format je spolehlivější než stream (stream může vrátit N/A)
    duration = None
    for sel, entries in [(None, "format=duration"), ("v:0", "stream=duration")]:
        cmd = ["ffprobe", "-v", "error"]
        if sel:
            cmd += ["-select_streams", sel]
        cmd += ["-show_entries", entries, "-of", "csv=p=0", path]
        r = subprocess.run(cmd, capture_output=True, text=True, check=True)
        val = r.stdout.strip().split("\n")[0]
        if val and val != "N/A":
            duration = float(val)
            break
    if duration is None:
        raise RuntimeError("Nepodařilo se zjistit délku videa.")

    # FPS — zachováme originální hodnotu jako string pro -r flag
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", path],
        capture_output=True, text=True, check=True
    )
    fps_str = r.stdout.strip().split("\n")[0]
    if "/" in fps_str:
        num, den = fps_str.split("/")
        fps = float(num) / float(den)
    else:
        fps = float(fps_str)

    frame_count = round(duration * fps)

    # Audio
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a",
         "-show_entries", "stream=codec_type", "-of", "csv=p=0", path],
        capture_output=True, text=True
    )
    audio = bool(r.stdout.strip())

    return duration, fps_str, fps, frame_count, audio


def run_ff(cmd: list, label: str = ""):
    if label:
        print(f"[*] {label}...")
    subprocess.run(cmd, check=True, capture_output=True)


def create_pingpong_loop(
    input_file: str,
    output_file: str,
    target_duration: float = 60.0,
    crf: int = 20,
):
    input_path = Path(input_file)
    if not input_path.exists():
        raise FileNotFoundError(f"Soubor nenalezen: {input_file}")

    print("[*] Analyzuji vstupní video...")
    duration, fps_str, fps, frame_count, audio = get_video_info(input_file)
    print(
        f"[OK] Délka: {duration:.2f}s | FPS: {fps:.3f} ({fps_str}) "
        f"| Framy: {frame_count} | Audio: {'ano' if audio else 'ne'}"
    )

    if frame_count < 3:
        raise ValueError("Video musí mít alespoň 3 framy pro seamless smyčku.")

    # Každý segment = frame_count-1 framů.
    # Poslední frame je vynechán, aby na spoji nevznikl duplikát:
    #   fwd:   [F0, F1, ..., F(N-2)]          (bez F(N-1))
    #   rev:   [F(N-1), F(N-2), ..., F1]      (bez F0)
    #   cyklus:[F0, ..., F(N-2), F(N-1), ..., F1]  → bez jakékoliv duplicity
    seg_frames = frame_count - 1          # počet framů v jednom segmentu
    seg_duration = seg_frames / fps       # délka segmentu v sekundách
    cycle_duration = seg_duration * 2     # fwd + rev

    num_cycles = int(target_duration / cycle_duration) + 2
    print(
        f"[*] Segment: {seg_frames} framů ({seg_duration:.3f}s) "
        f"| Cyklus: {cycle_duration:.3f}s | Cyklů: {num_cycles}"
    )

    # select='lte(n,X)' vybere framy 0..X z výstupu předchozího filtru.
    # Po reverse je n=0 poslední frame originálu → lte(n, seg_frames-1) = framy 0..N-2.
    select_expr = f"lte(n,{seg_frames - 1})"

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        fwd = tmp / "fwd.mp4"
        rev = tmp / "rev.mp4"
        cycle = tmp / "cycle.mp4"

        # === Krok 1: Forward — vyřadit poslední frame ===
        fwd_cmd = [
            "ffmpeg", "-i", input_file,
            "-vf", f"select='{select_expr}',setpts=PTS-STARTPTS",
            "-c:v", "libx264", "-crf", str(crf), "-preset", "fast",
            "-pix_fmt", "yuv420p", "-r", fps_str,
        ]
        if audio:
            fwd_cmd += [
                "-af", f"atrim=end={seg_duration:.6f},asetpts=PTS-STARTPTS",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            ]
        else:
            fwd_cmd += ["-an"]
        fwd_cmd += ["-y", str(fwd)]
        run_ff(fwd_cmd, "Encoduji forward (bez posledního framu)")

        # === Krok 2: Reverse — otočit, pak vyřadit poslední frame (= F0 originálu) ===
        rev_cmd = [
            "ffmpeg", "-i", input_file,
            "-vf", f"reverse,select='{select_expr}',setpts=PTS-STARTPTS",
            "-c:v", "libx264", "-crf", str(crf), "-preset", "fast",
            "-pix_fmt", "yuv420p", "-r", fps_str,
        ]
        if audio:
            rev_cmd += [
                "-af", f"areverse,atrim=end={seg_duration:.6f},asetpts=PTS-STARTPTS",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
            ]
        else:
            rev_cmd += ["-an"]
        rev_cmd += ["-y", str(rev)]
        run_ff(rev_cmd, "Encoduji reverse (bez frame 0 originálu)")

        # === Krok 3: Finální concat — přímo střídej fwd/rev bez mezikroku cycle.mp4 ===
        final_list = tmp / "final_list.txt"
        final_list.write_text(
            "".join(
                f"file '{fwd.as_posix()}'\nfile '{rev.as_posix()}'\n"
                for _ in range(num_cycles)
            ),
            encoding="utf-8",
        )

        print(
            f"[*] Generuji finalni video "
            f"({num_cycles}x cyklus ~{num_cycles * cycle_duration:.1f}s -> orez na {target_duration}s)..."
        )
        final_cmd = [
            "ffmpeg",
            "-f", "concat", "-safe", "0", "-i", str(final_list),
            "-t", str(target_duration),
            "-c:v", "copy",
        ]
        if audio:
            final_cmd += ["-c:a", "copy"]
        else:
            final_cmd += ["-an"]
        final_cmd += ["-movflags", "+faststart", "-y", output_file]
        subprocess.run(final_cmd, check=True, capture_output=True)

        # Verifikace výstupu
        out_dur, _, _, out_frames, _ = get_video_info(output_file)
        print(f"[OK] Hotovo! → {output_file}")
        print(f"[OK] Výsledná délka: {out_dur:.2f}s ({out_frames} framů)")


def create_smooth_pingpong_loop(
    input_file: str,
    output_file: str,
    target_duration: float = 60.0,
    crf: int = 20,
    xfade_dur: float = 0.5,
):
    """
    Ping-pong smyčka s xfade dissolve na každém přechodu fwd↔rev.

    Princip: fwd končí na framu N-1, rev začíná na framu N-1 (totožný obsah).
    Xfade dissolví mezi stejnými framy → vypadá jako přirozené "zpomalení" při obratu,
    nikoliv jako abruptní střih. Stejně tak rev→fwd na framu 0.
    """
    input_path = Path(input_file)
    if not input_path.exists():
        raise FileNotFoundError(f"Soubor nenalezen: {input_file}")

    print("[*] Analyzuji vstupní video...")
    duration, fps_str, fps, frame_count, audio = get_video_info(input_file)
    print(
        f"[OK] Délka: {duration:.2f}s | FPS: {fps:.3f} ({fps_str}) "
        f"| Framy: {frame_count} | Audio: {'ano' if audio else 'ne'}"
    )

    if xfade_dur >= duration:
        raise ValueError(f"--xfade ({xfade_dur}s) musí být kratší než video ({duration:.2f}s).")
    if xfade_dur < 0.1:
        raise ValueError("--xfade musí být alespoň 0.1s.")

    # Počet segmentů: N seg × duration − (N−1) × xfade_dur ≥ target_duration
    # → N ≥ (target_duration − xfade_dur) / (duration − xfade_dur)
    num_segs = math.ceil((target_duration - xfade_dur) / (duration - xfade_dur)) + 1
    num_cycles = math.ceil(num_segs / 2)   # pro info
    total_est = num_segs * duration - (num_segs - 1) * xfade_dur
    print(
        f"[*] xfade: {xfade_dur}s | Segmenty: {num_segs} ({num_cycles} fwd+rev cyklů) "
        f"| Celkem ~{total_est:.1f}s → orez na {target_duration}s"
    )

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp = Path(tmp_dir)
        fwd = tmp / "fwd.mp4"
        rev = tmp / "rev.mp4"

        # Krok 1: Encode fwd (celé video)
        fwd_cmd = [
            "ffmpeg", "-i", input_file,
            "-c:v", "libx264", "-crf", str(crf), "-preset", "fast",
            "-pix_fmt", "yuv420p", "-r", fps_str,
        ]
        if audio:
            fwd_cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "44100"]
        else:
            fwd_cmd += ["-an"]
        fwd_cmd += ["-y", str(fwd)]
        run_ff(fwd_cmd, "Encoduji forward")

        # Krok 2: Encode rev (celé video, obrácené)
        rev_cmd = [
            "ffmpeg", "-i", input_file,
            "-vf", "reverse",
            "-c:v", "libx264", "-crf", str(crf), "-preset", "fast",
            "-pix_fmt", "yuv420p", "-r", fps_str,
        ]
        if audio:
            rev_cmd += ["-af", "areverse", "-c:a", "aac", "-b:a", "128k", "-ar", "44100"]
        else:
            rev_cmd += ["-an"]
        rev_cmd += ["-y", str(rev)]
        run_ff(rev_cmd, "Encoduji reverse")

        # Krok 3: Sestavení filter_complex s xfade na každém přechodu
        #
        # Vstupy: [fwd, rev, fwd, rev, ...] — num_segs celkem
        # Video: [0:v][1:v]xfade=fade:dur:offset=O0[cv1]; [cv1][2:v]xfade=...[cv2]; ...
        # Audio: [0:a][1:a]acrossfade=d=dur[ca1]; [ca1][2:a]acrossfade=...[ca2]; ...
        #
        # Offset k-tého xfade = accumulated_duration_after_k_segments − xfade_dur
        # kde acc_dur roste o (duration − xfade_dur) po každém segmentu.

        input_args = []
        seg_files = [fwd if i % 2 == 0 else rev for i in range(num_segs)]
        for f in seg_files:
            input_args += ["-i", str(f)]

        fc_v, fc_a = [], []
        prev_v = "[0:v]"
        prev_a = "[0:a]" if audio else None
        acc_dur = duration  # po prvním segmentu

        for k in range(1, num_segs):
            is_last = (k == num_segs - 1)
            out_v = "[vout]" if is_last else f"[cv{k}]"
            out_a = "[aout]" if (audio and is_last) else (f"[ca{k}]" if audio else None)

            offset = acc_dur - xfade_dur
            fc_v.append(
                f"{prev_v}[{k}:v]xfade=transition=fade:duration={xfade_dur}:offset={offset:.4f}{out_v}"
            )
            if audio:
                fc_a.append(f"{prev_a}[{k}:a]acrossfade=d={xfade_dur}:c1=tri:c2=tri{out_a}")

            prev_v = out_v
            prev_a = out_a
            acc_dur += duration - xfade_dur

        fc_str = ";".join(fc_v)
        if audio:
            fc_str += ";" + ";".join(fc_a)

        print(f"[*] Generuji finální video ({num_segs - 1}× xfade přechod)...")
        final_cmd = ["ffmpeg"] + input_args + [
            "-filter_complex", fc_str,
            "-map", "[vout]",
        ]
        if audio:
            final_cmd += ["-map", "[aout]"]
        final_cmd += [
            "-t", str(target_duration),
            "-c:v", "libx264", "-crf", str(crf), "-preset", "fast",
            "-pix_fmt", "yuv420p",
        ]
        if audio:
            final_cmd += ["-c:a", "aac", "-b:a", "128k"]
        final_cmd += ["-movflags", "+faststart", "-y", output_file]
        subprocess.run(final_cmd, check=True, capture_output=True)

        out_dur, _, _, out_frames, _ = get_video_info(output_file)
        print(f"[OK] Hotovo! → {output_file}")
        print(f"[OK] Výsledná délka: {out_dur:.2f}s ({out_frames} framů)")


def main():
    parser = argparse.ArgumentParser(
        description="Ping-pong video loop: forward → reverse → forward → ..."
    )
    parser.add_argument("input", help="Vstupní video")
    parser.add_argument("output", nargs="?", help="Výstupní video (default: <input>_loop.mp4)")
    parser.add_argument("--duration", type=float, default=60.0,
                        help="Cílová délka v sekundách (default: 60)")
    parser.add_argument("--quality", type=int, default=20,
                        help="CRF kvalita 0–51, nižší = lepší (default: 20)")
    parser.add_argument("--xfade", type=float, default=0.0,
                        help="Crossfade dissolve délka v sekundách na přechodech fwd↔rev "
                             "(0 = bez dissolve, default; doporučeno 0.4–0.8)")
    args = parser.parse_args()

    output = args.output or f"{Path(args.input).stem}_loop.mp4"

    try:
        if args.xfade > 0:
            create_smooth_pingpong_loop(
                args.input, output, args.duration, args.quality, args.xfade
            )
        else:
            create_pingpong_loop(args.input, output, args.duration, args.quality)
    except Exception as e:
        print(f"[CHYBA] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
