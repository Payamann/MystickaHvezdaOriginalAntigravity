#!/usr/bin/env python3
"""Build a ready-to-upload vertical Reel from local TikTok loops.

Default use case:
  python reel_factory.py --music-dir "C:/Users/pavel/Downloads"

OpenAI generation requires OPENAI_API_KEY. Dry-run and supplied audio need no TTS key.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent.parent
AGENT_ROOT = Path(__file__).resolve().parent
DEFAULT_VIDEO_DIR = Path("C:/TIkTok")
DEFAULT_MUSIC_DIRS = [
    Path("C:/Users/pavel/Downloads"),
    Path("C:/Users/pavel/Music"),
]
OUTPUT_ROOT = AGENT_ROOT / "output" / "reels"
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from openai_reel_audio import (DEFAULT_MODEL, DEFAULT_VOICE, DISCLOSURE,
    prepare_narration, synthesize_narration)
ZODIAC_WORDS = {
    "beran",
    "byk",
    "býk",
    "blizenci",
    "blíženci",
    "rak",
    "lev",
    "pana",
    "panna",
    "vahy",
    "váhy",
    "stir",
    "štír",
    "strelec",
    "střelec",
    "kozoroh",
    "vodnar",
    "vodnář",
    "ryby",
}


@dataclass(frozen=True)
class ReelCopy:
    title: str
    voiceover: str
    caption: str
    cta_url: str
    topic: str
    hook: str
    intent: str


def run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        raise RuntimeError(
            "Command failed:\n"
            + " ".join(cmd)
            + "\n\nSTDOUT:\n"
            + result.stdout
            + "\n\nSTDERR:\n"
            + result.stderr
        )
    return result


def ffprobe_duration(path: Path) -> float:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ]
    )
    return float(result.stdout.strip().replace(",", "."))


def ffprobe_has_audio(path: Path) -> bool:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "a",
            "-show_entries",
            "stream=index",
            "-of",
            "csv=p=0",
            str(path),
        ]
    )
    return bool(result.stdout.strip())


def load_env() -> None:
    load_dotenv(AGENT_ROOT / ".env")
    load_dotenv(PROJECT_ROOT / ".env")


def build_personal_map_copy() -> ReelCopy:
    voiceover = """Jestli máš pocit, že se ti pořád vrací stejná lekce, možná nepotřebuješ další obecný horoskop.
Potřebuješ mapu.

Příštích dvanáct měsíců ještě není napsaných.
Ale některá témata už klepou na dveře:
kde ztrácíš energii,
kde čekáš na cizí svolení,
a kde už dávno víš, že další krok má přijít od tebe.

Osobní mapa na dvanáct měsíců je dvacetistránkový PDF výklad na míru.
Začne dnem nákupu a provede tě celým osobním rokem. Dostaneš hlavní téma, orientační milníky napříč obdobím a malé kroky, které zvládneš i v obyčejném dni.

Není to předplatné.
Je to jednorázová mapa za dvě stě devadesát devět korun.

Otevři si Osobní mapu na Mystická Hvězda.
Odkaz najdeš u videa."""

    caption = """Jestli se ti opakuje stejný pocit, možná není potřeba tlačit víc. Možná je potřeba konečně pojmenovat, co se ti příštích dvanáct měsíců snaží ukázat.

Osobní mapa je 20stránkový PDF výklad na míru pro celých 12 navazujících měsíců od dne nákupu: hlavní téma, orientační milníky napříč obdobím a konkrétní kroky pro běžné dny.

Jednorázově 299 Kč. Bez předplatného.

https://www.mystickahvezda.cz/osobni-mapa.html?utm_source=facebook&utm_medium=reels&utm_campaign=personal_map_12_months&utm_content=auto_reel

#mystickaHvezda #osobnimapa #osobnirok #astrologie #sebereflexe"""

    return ReelCopy(
        title="Osobní mapa na 12 měsíců",
        voiceover=voiceover,
        caption=caption,
        cta_url="https://www.mystickahvezda.cz/osobni-mapa.html",
        topic="Osobní mapa na 12 měsíců",
        hook="pattern_interrupt",
        intent="direct_promo",
    )


def normalize_name(path: Path) -> str:
    return path.name.lower().replace("_", " ").replace("-", " ")


def find_video(video_dir: Path) -> Path:
    if not video_dir.exists():
        raise FileNotFoundError(f"Video folder does not exist: {video_dir}")

    candidates = [p for p in video_dir.iterdir() if p.is_file() and p.suffix.lower() in {".mp4", ".mov", ".m4v"}]
    if not candidates:
        raise FileNotFoundError(f"No video files found in {video_dir}")

    scored: list[tuple[int, float, Path]] = []
    for path in candidates:
        name = normalize_name(path)
        score = 0
        if "loop" in name:
            score += 30
        if any(word in name for word in ZODIAC_WORDS):
            score -= 20
        if "120" in name:
            score += 10
        if "60" in name:
            score += 3
        score += int(path.stat().st_mtime / 1_000_000)
        scored.append((score, path.stat().st_mtime, path))

    return max(scored, key=lambda item: (item[0], item[1]))[2]


def audio_files(paths: Iterable[Path]) -> Iterable[Path]:
    for root in paths:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in {".mp3", ".wav", ".m4a", ".aac", ".flac"}:
                yield path


def find_music(music_dir: Path | None, music_file: Path | None) -> Path | None:
    if music_file:
        if not music_file.exists():
            raise FileNotFoundError(f"Music file does not exist: {music_file}")
        return music_file

    roots = [music_dir] if music_dir else DEFAULT_MUSIC_DIRS
    candidates = [
        p
        for p in audio_files([root for root in roots if root])
        if not p.name.lower().startswith("elevenlabs")
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def sentence_chunks(text: str) -> list[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    raw = re.split(r"(?<=[.!?])\s+", clean)
    chunks: list[str] = []
    for sentence in raw:
        words = sentence.split()
        current: list[str] = []
        for word in words:
            current.append(word)
            if len(" ".join(current)) >= 34 or len(current) >= 6:
                chunks.append(" ".join(current))
                current = []
        if current:
            chunks.append(" ".join(current))
    return [c for c in chunks if c]


def ass_time(seconds: float) -> str:
    seconds = max(0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - math.floor(seconds)) * 100))
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", r"\{").replace("}", r"\}")


def line_break(text: str, max_chars: int = 27) -> str:
    words = text.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        trial = " ".join(current + [word])
        if current and len(trial) > max_chars:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    if len(lines) > 2:
        lines = [" ".join(lines[:-1]), lines[-1]]
    return r"\N".join(ass_escape(line) for line in lines)


def write_captions(text: str, duration: float, out_path: Path) -> None:
    chunks = sentence_chunks(text)
    weights = [max(1, len(c.split())) for c in chunks]
    total_weight = sum(weights) or 1
    usable_duration = max(1.0, duration - 0.25)
    start = 0.10

    events: list[str] = []
    for chunk, weight in zip(chunks, weights):
        length = max(1.35, usable_duration * weight / total_weight)
        end = min(duration - 0.05, start + length)
        if end <= start:
            break
        events.append(
            f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Reel,,0,0,0,,{line_break(chunk)}"
        )
        start = end

    out_path.write_text(
        "\n".join(
            [
                "[Script Info]",
                "ScriptType: v4.00+",
                "PlayResX: 1080",
                "PlayResY: 1920",
                "ScaledBorderAndShadow: yes",
                "WrapStyle: 0",
                "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
                "Style: Reel,Arial,46,&H00FFFFFF,&H00FFFFFF,&H00050510,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,90,90,235,1",
                "",
                "[Events]",
                "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
                *events,
                "",
            ]
        ),
        encoding="utf-8",
    )


def compose_video(
    base_video: Path,
    voiceover: Path,
    music: Path | None,
    captions: Path,
    out_path: Path,
    duration: float,
) -> None:
    inputs = ["-stream_loop", "-1", "-i", str(base_video), "-i", str(voiceover)]
    if music:
        inputs += ["-stream_loop", "-1", "-i", str(music)]

    video_filter = (
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,trim=duration={duration:.3f},setpts=PTS-STARTPTS,"
        "eq=brightness=-0.03:contrast=1.05:saturation=1.08,"
        "ass=captions.ass[v]"
    ).format(duration=duration)

    if music:
        audio_filter = (
            "[1:a]volume=1.35,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS[vocal];"
            "[2:a]volume=0.13,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS[music];"
            "[vocal][music]amix=inputs=2:duration=first:dropout_transition=0,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[a]"
        ).format(duration=duration)
    else:
        audio_filter = (
            "[1:a]volume=1.25,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[a]"
        ).format(duration=duration)

    cmd = [
        "ffmpeg",
        "-y",
        *inputs,
        "-filter_complex",
        f"{video_filter};{audio_filter}",
        "-map",
        "[v]",
        "-map",
        "[a]",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-profile:v",
        "high",
        "-crf",
        "21",
        "-preset",
        "medium",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        "-shortest",
        str(out_path),
    ]
    run(cmd, cwd=out_path.parent)


def main() -> int:
    load_env()
    parser = argparse.ArgumentParser(description="Generate and assemble a Mysticka Hvezda Reel.")
    parser.add_argument("--video-dir", type=Path, default=DEFAULT_VIDEO_DIR)
    parser.add_argument("--base-video", type=Path)
    parser.add_argument("--music-dir", type=Path)
    parser.add_argument("--music-file", type=Path)
    parser.add_argument("--voice", default=os.getenv("OPENAI_AUDIO_VOICE", DEFAULT_VOICE))
    parser.add_argument("--audio-model", default=os.getenv("OPENAI_AUDIO_MODEL", DEFAULT_MODEL))
    parser.add_argument("--voiceover-file", type=Path, help="Use an existing MP3/WAV instead of OpenAI.")
    parser.add_argument("--dry-run", action="store_true", help="Write copy and show selected assets without rendering.")
    args = parser.parse_args()

    copy = build_personal_map_copy()
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = OUTPUT_ROOT / f"auto_personal_map_2026_{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)

    script_path = out_dir / "voiceover.txt"
    caption_path = out_dir / "facebook_caption.txt"
    metadata_path = out_dir / "reel_metadata.json"
    voiceover_path = out_dir / "voiceover_openai.wav"
    if args.voiceover_file:
        voiceover_path = out_dir / ("voiceover_supplied" + args.voiceover_file.suffix)
    captions_path = out_dir / "captions.ass"
    final_path = out_dir / "final_reel.mp4"

    spoken_text, delivery_instructions = prepare_narration(copy.voiceover)
    script_path.write_text(spoken_text, encoding="utf-8")
    caption_path.write_text(copy.caption + ("\n\n" + DISCLOSURE if not args.voiceover_file else ""), encoding="utf-8")

    base_video = args.base_video or find_video(args.video_dir)
    music = find_music(args.music_dir, args.music_file)

    metadata = {
        "audio_provider": "supplied_file" if args.voiceover_file else "openai",
        "audio_model": args.audio_model,
        "voice": args.voice,
        "ai_voice_disclosure": DISCLOSURE if not args.voiceover_file else None,
        "caption_timing": "approximate",
        "title": copy.title,
        "topic": copy.topic,
        "hook": copy.hook,
        "intent": copy.intent,
        "base_video": str(base_video),
        "music": str(music) if music else None,
        "output_dir": str(out_dir),
    }

    if args.dry_run:
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(metadata, ensure_ascii=False, indent=2))
        print(f"Script: {script_path}")
        print(f"Caption: {caption_path}")
        return 0

    if args.voiceover_file:
        if not args.voiceover_file.exists():
            raise FileNotFoundError(f"Voiceover file does not exist: {args.voiceover_file}")
        voiceover_path.write_bytes(args.voiceover_file.read_bytes())
    else:
        synthesize_narration(text=spoken_text, out_path=voiceover_path,
                             voice=args.voice, model=args.audio_model,
                             instructions=delivery_instructions)

    duration = ffprobe_duration(voiceover_path)
    write_captions(spoken_text, duration=duration, out_path=captions_path)
    compose_video(
        base_video=base_video,
        voiceover=voiceover_path,
        music=music,
        captions=captions_path,
        out_path=final_path,
        duration=duration,
    )

    metadata["voiceover"] = str(voiceover_path)
    metadata["captions"] = str(captions_path)
    metadata["final"] = str(final_path)
    metadata["duration"] = duration
    metadata["base_video_has_audio"] = ffprobe_has_audio(base_video)
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(metadata, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
