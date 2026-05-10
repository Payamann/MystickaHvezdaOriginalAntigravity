#!/usr/bin/env python3
"""Assemble a Daily Reel 2 video from script JSON, ElevenLabs voiceover, and FFmpeg.

The script keeps the bracketed delivery tags for ElevenLabs, creates a separate
clean transcript for captions, and can run in dry-run mode without paid API calls.
"""

from __future__ import annotations

import argparse
import base64
import json
import math
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

import requests


PROJECT_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_DIR = PROJECT_ROOT / "scripts"
SCRIPT_OUTPUT_DIR = SCRIPT_DIR / "output"
SOCIAL_ROOT = PROJECT_ROOT / "social-media-agent"
DEFAULT_OUTPUT_ROOT = SOCIAL_ROOT / "output" / "reels" / "daily_reel2"
DEFAULT_TEMPLATE_DIRS = [
    PROJECT_ROOT / "templates" / "reel2",
    PROJECT_ROOT / "templates" / "reels",
    Path("C:/TIkTok"),
    Path("C:/TikTok"),
    Path("C:/Users/pavel/Downloads"),
]
ELEVEN_API = "https://api.elevenlabs.io/v1"

TAG_RE = re.compile(r"\[([^\[\]\n]{1,40})\]")
BREAK_RE = re.compile(r"<break\s+time=[\"']([\d.]+)s[\"']\s*/>", re.IGNORECASE)
VOICEOVER_SECTION_RE = re.compile(r"##\s*Voiceover|VOICEOVER SCRIPT", re.IGNORECASE)
MARKDOWN_FENCE_RE = re.compile(r"```(?:text|json)?\s*|\s*```", re.IGNORECASE)
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "\U00002600-\U000026FF"
    "]+",
    re.UNICODE,
)

TAG_MAP = {
    "clearly": "clear",
    "soft": "softly",
    "gentle": "gentle",
    "warm": "warm",
    "confident": "confident",
    "intense": "intense",
    "commanding": "commanding",
    "mysterious": "mysterious",
    "serious": "serious",
    "upbeat": "upbeat",
    "inviting": "inviting",
}


@dataclass(frozen=True)
class ReelScript:
    source_path: Path
    date: str
    sign: str
    voiceover_raw: str
    tiktok_description: str | None
    facebook_description: str | None
    suno: str | None
    thumbnail: str | None
    payload: dict[str, Any]


def run(cmd: list[str], *, cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
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


def load_env() -> None:
    for env_path in [
        SOCIAL_ROOT / ".env",
        PROJECT_ROOT / ".env",
        PROJECT_ROOT / "server" / ".env",
        SCRIPT_DIR / ".env",
    ]:
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            os.environ.setdefault(key, value)


def safe_slug(value: str) -> str:
    value = value.strip().lower()
    value = (
        value.replace("á", "a")
        .replace("č", "c")
        .replace("ď", "d")
        .replace("é", "e")
        .replace("ě", "e")
        .replace("í", "i")
        .replace("ň", "n")
        .replace("ó", "o")
        .replace("ř", "r")
        .replace("š", "s")
        .replace("ť", "t")
        .replace("ú", "u")
        .replace("ů", "u")
        .replace("ý", "y")
        .replace("ž", "z")
    )
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "unknown"


def find_script_json(date_value: str, sign: str | None) -> Path:
    if sign:
        wanted = safe_slug(sign)
        matches = sorted(SCRIPT_OUTPUT_DIR.glob(f"voiceover2_{date_value}_{wanted}.json"))
        if matches:
            return matches[-1]

        all_matches = sorted(SCRIPT_OUTPUT_DIR.glob(f"voiceover2_{date_value}_*.json"))
        for path in all_matches:
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            if safe_slug(str(payload.get("sign", ""))) == wanted:
                return path
        raise FileNotFoundError(f"No Daily Reel 2 JSON found for {date_value} / {sign}.")

    matches = sorted(SCRIPT_OUTPUT_DIR.glob(f"voiceover2_{date_value}_*.json"))
    if not matches:
        raise FileNotFoundError(f"No Daily Reel 2 JSON found for {date_value}.")
    return matches[-1]


def load_script(path: Path) -> ReelScript:
    payload = json.loads(path.read_text(encoding="utf-8"))
    outputs = payload.get("outputs", {}) or {}
    voiceover = str(outputs.get("voiceover") or "").strip()
    if not voiceover:
        raise ValueError(f"JSON has no outputs.voiceover: {path}")
    signs = payload.get("signs") or []
    sign = str(payload.get("sign") or (signs[0] if signs else "") or "unknown")
    return ReelScript(
        source_path=path,
        date=str(payload.get("date") or ""),
        sign=sign,
        voiceover_raw=voiceover,
        tiktok_description=outputs.get("tiktok_description"),
        facebook_description=outputs.get("facebook_description"),
        suno=outputs.get("suno"),
        thumbnail=outputs.get("thumbnail"),
        payload=payload,
    )


def read_voiceover_file(path: Path, date_value: str | None, sign: str | None) -> ReelScript:
    text = path.read_text(encoding="utf-8")
    text = MARKDOWN_FENCE_RE.sub("", text).strip()
    return ReelScript(
        source_path=path,
        date=date_value or "",
        sign=sign or "unknown",
        voiceover_raw=extract_voiceover_from_text(text),
        tiktok_description=None,
        facebook_description=None,
        suno=None,
        thumbnail=None,
        payload={},
    )


def extract_voiceover_from_text(text: str) -> str:
    if "TIKTOK / INSTAGRAM DESCRIPTION" in text:
        text = text.split("TIKTOK / INSTAGRAM DESCRIPTION", 1)[0]
    if "Facebook Reels Description" in text:
        text = text.split("Facebook Reels Description", 1)[0]
    if VOICEOVER_SECTION_RE.search(text):
        parts = re.split(VOICEOVER_SECTION_RE, text, maxsplit=1)
        text = parts[-1]
    text = re.sub(r"={4,}", "", text)
    return text.strip()


def strip_date_header(text: str) -> str:
    lines = [line.strip() for line in text.strip().splitlines()]
    while lines and not lines[0]:
        lines.pop(0)
    if lines and re.search(r"\d{1,2}\.\s+\w+\s+\d{4}", lines[0]):
        lines.pop(0)
    return "\n".join(lines).strip()


def normalize_for_tts(raw: str, *, pause_mode: str) -> str:
    text = strip_date_header(raw)

    def tag_repl(match: re.Match[str]) -> str:
        tag = match.group(1).strip().lower().replace("_", " ")
        tag = TAG_MAP.get(tag, tag)
        return f"[{tag}]"

    text = TAG_RE.sub(tag_repl, text)

    def break_repl(match: re.Match[str]) -> str:
        seconds = float(match.group(1))
        if pause_mode == "ssml":
            return f' <break time="{seconds:g}s" /> '
        if seconds >= 0.9:
            return " [long pause]\n\n"
        if seconds >= 0.45:
            return " [short pause]\n"
        return " ... "

    text = BREAK_RE.sub(break_repl, text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_for_captions(raw: str) -> str:
    text = strip_date_header(raw)
    text = TAG_RE.sub("", text)
    text = BREAK_RE.sub(" ", text)
    text = EMOJI_RE.sub("", text)
    text = text.replace("⬇️", "")
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+([,.!?;:])", r"\1", text)
    return text


def split_caption_phrases(text: str, *, max_chars: int, max_words: int) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    rough_parts = re.split(r"(?<=[.!?])\s+|(?<=:)\s+|(?<=—)\s+", text)
    phrases: list[str] = []
    for part in rough_parts:
        words = part.split()
        current: list[str] = []
        for word in words:
            trial = " ".join(current + [word])
            if current and (len(trial) > max_chars or len(current) >= max_words):
                phrases.append(" ".join(current))
                current = [word]
            else:
                current.append(word)
        if current:
            phrases.append(" ".join(current))
    return [phrase.strip() for phrase in phrases if phrase.strip()]


def ass_time(seconds: float) -> str:
    seconds = max(0.0, seconds)
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - math.floor(seconds)) * 100))
    if cs >= 100:
        cs = 0
        s += 1
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"


def ass_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("{", r"\{").replace("}", r"\}")


def ass_header(font_size: int, outline: int, alignment: int, margin_v: int) -> str:
    return "\n".join(
        [
            "[Script Info]",
            "ScriptType: v4.00+",
            "PlayResX: 1080",
            "PlayResY: 1920",
            "WrapStyle: 2",
            "ScaledBorderAndShadow: yes",
            "",
            "[V4+ Styles]",
            "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
            f"Style: Default,Arial,{font_size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,{outline},0,{alignment},70,70,{margin_v},1",
            "",
            "[Events]",
            "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
        ]
    )


def write_ass_from_events(
    events: list[tuple[float, float, str]],
    out_path: Path,
    *,
    font_size: int,
    outline: int,
    alignment: int,
    margin_v: int,
) -> None:
    lines = [ass_header(font_size, outline, alignment, margin_v)]
    for start, end, text in events:
        if end <= start:
            continue
        lines.append(
            f"Dialogue: 0,{ass_time(start)},{ass_time(end)},Default,,0,0,0,,{ass_escape(text)}"
        )
    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


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


def audio_files(paths: Iterable[Path]) -> Iterable[Path]:
    for root in paths:
        if not root or not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in {".mp3", ".wav", ".m4a", ".aac", ".flac"}:
                yield path


def video_files(paths: Iterable[Path]) -> Iterable[Path]:
    for root in paths:
        if not root or not root.exists():
            continue
        for path in root.rglob("*"):
            if path.is_file() and path.suffix.lower() in {".mp4", ".mov", ".m4v"}:
                yield path


def find_template_video(base_video: Path | None, template_dir: Path | None) -> Path:
    if base_video:
        if not base_video.exists():
            raise FileNotFoundError(f"Base video does not exist: {base_video}")
        return base_video
    roots = [template_dir] if template_dir else DEFAULT_TEMPLATE_DIRS
    candidates = list(video_files([root for root in roots if root]))
    if not candidates:
        raise FileNotFoundError(
            "No template video found. Pass --base-video or put MP4/MOV files in templates/reel2."
        )
    return max(candidates, key=lambda path: path.stat().st_mtime)


def find_music(music_file: Path | None, music_dir: Path | None) -> Path | None:
    if music_file:
        if not music_file.exists():
            raise FileNotFoundError(f"Music file does not exist: {music_file}")
        return music_file
    if not music_dir:
        return None
    candidates = list(audio_files([music_dir]))
    if not candidates:
        return None
    return max(candidates, key=lambda path: path.stat().st_mtime)


def resolve_voice_id(api_key: str, voice_id: str | None, voice_name: str | None) -> str:
    if voice_id:
        return voice_id
    if os.getenv("ELEVENLABS_VOICE_ID"):
        return os.environ["ELEVENLABS_VOICE_ID"]
    if not voice_name:
        raise RuntimeError("Missing voice. Set ELEVENLABS_VOICE_ID or pass --voice-name.")

    response = requests.get(
        f"{ELEVEN_API}/voices",
        headers={"xi-api-key": api_key},
        timeout=30,
    )
    response.raise_for_status()
    wanted = voice_name.strip().casefold()
    voices = response.json().get("voices", [])
    for voice in voices:
        if voice.get("name", "").strip().casefold() == wanted:
            return str(voice["voice_id"])
    names = ", ".join(sorted(v.get("name", "") for v in voices if v.get("name")))
    raise RuntimeError(f"Voice named {voice_name!r} was not found. Available voices: {names}")


def elevenlabs_tts(
    *,
    text: str,
    out_path: Path,
    voice_id: str | None,
    voice_name: str | None,
    model_id: str,
    dry_run: bool,
) -> str | None:
    load_env()
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ELEVENLABS_API_KEY.")
    resolved_voice_id = resolve_voice_id(api_key, voice_id, voice_name)
    if dry_run:
        return resolved_voice_id

    payload: dict[str, Any] = {
        "text": text,
        "model_id": model_id,
    }
    voice_settings: dict[str, Any] = {}
    if os.getenv("ELEVENLABS_STABILITY"):
        voice_settings["stability"] = float(os.environ["ELEVENLABS_STABILITY"])
    if os.getenv("ELEVENLABS_SIMILARITY"):
        voice_settings["similarity_boost"] = float(os.environ["ELEVENLABS_SIMILARITY"])
    if os.getenv("ELEVENLABS_STYLE"):
        voice_settings["style"] = float(os.environ["ELEVENLABS_STYLE"])
    if os.getenv("ELEVENLABS_SPEED"):
        voice_settings["speed"] = float(os.environ["ELEVENLABS_SPEED"])
    if os.getenv("ELEVENLABS_SPEAKER_BOOST"):
        voice_settings["use_speaker_boost"] = os.environ["ELEVENLABS_SPEAKER_BOOST"].lower() not in {
            "0",
            "false",
            "no",
        }
    if voice_settings:
        payload["voice_settings"] = voice_settings

    response = requests.post(
        f"{ELEVEN_API}/text-to-speech/{resolved_voice_id}",
        params={"output_format": os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128")},
        headers={
            "xi-api-key": api_key,
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        timeout=180,
    )
    response.raise_for_status()
    out_path.write_bytes(response.content)
    return resolved_voice_id


def elevenlabs_force_align(audio_path: Path, text: str, out_path: Path) -> dict[str, Any]:
    load_env()
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing ELEVENLABS_API_KEY.")
    with audio_path.open("rb") as audio:
        response = requests.post(
            f"{ELEVEN_API}/forced-alignment",
            headers={"xi-api-key": api_key},
            files={"file": (audio_path.name, audio, "audio/mpeg")},
            data={"text": text},
            timeout=180,
        )
    response.raise_for_status()
    payload = response.json()
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def words_from_alignment(payload: dict[str, Any]) -> list[dict[str, Any]]:
    words = []
    for item in payload.get("words", []) or []:
        text = str(item.get("text", "")).strip()
        start = item.get("start")
        end = item.get("end")
        if text and isinstance(start, (int, float)) and isinstance(end, (int, float)):
            words.append({"text": text, "start": float(start), "end": float(end)})
    return words


def caption_events_from_words(
    words: list[dict[str, Any]],
    *,
    max_chars: int,
    max_words: int,
    max_duration: float,
) -> list[tuple[float, float, str]]:
    events: list[tuple[float, float, str]] = []
    current: list[dict[str, Any]] = []

    def flush() -> None:
        nonlocal current
        if not current:
            return
        text = " ".join(str(w["text"]) for w in current)
        text = re.sub(r"\s+([,.!?;:])", r"\1", text).strip()
        start = float(current[0]["start"])
        end = float(current[-1]["end"])
        events.append((start, end, text))
        current = []

    for word in words:
        trial = current + [word]
        trial_text = " ".join(str(w["text"]) for w in trial)
        trial_duration = float(word["end"]) - float(trial[0]["start"])
        force_flush = (
            current
            and (
                len(trial_text) > max_chars
                or len(trial) > max_words
                or trial_duration > max_duration
            )
        )
        if force_flush:
            flush()
        current.append(word)
        if re.search(r"[.!?]$", str(word["text"])) and len(current) >= 2:
            flush()
    flush()

    padded: list[tuple[float, float, str]] = []
    for idx, (start, end, text) in enumerate(events):
        next_start = events[idx + 1][0] if idx + 1 < len(events) else None
        padded_end = end + 0.08
        if next_start is not None:
            padded_end = min(padded_end, next_start - 0.03)
        padded.append((max(0.0, start - 0.02), max(end, padded_end), text))
    return padded


def approximate_caption_events(
    text: str,
    *,
    duration: float,
    max_chars: int,
    max_words: int,
) -> list[tuple[float, float, str]]:
    phrases = split_caption_phrases(text, max_chars=max_chars, max_words=max_words)
    if not phrases:
        return []
    weights = [max(1, len(phrase.split())) for phrase in phrases]
    total = sum(weights) or 1
    usable = max(1.0, duration - 0.35)
    start = 0.12
    events: list[tuple[float, float, str]] = []
    for phrase, weight in zip(phrases, weights):
        length = max(0.85, usable * weight / total)
        end = min(duration - 0.05, start + length)
        if end <= start:
            break
        events.append((start, end, phrase))
        start = end
    return events


def compose_video(
    *,
    base_video: Path,
    voiceover: Path,
    captions: Path,
    out_path: Path,
    duration: float,
    music: Path | None,
    music_volume: float,
) -> None:
    ass_target = out_path.parent / "captions.ass"
    if captions.resolve() != ass_target.resolve():
        shutil.copy2(captions, ass_target)
    inputs = ["-stream_loop", "-1", "-i", str(base_video), "-i", str(voiceover)]
    if music:
        inputs += ["-stream_loop", "-1", "-i", str(music)]

    video_filter = (
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,"
        "crop=1080:1920,trim=duration={duration:.3f},setpts=PTS-STARTPTS,"
        "eq=brightness=-0.02:contrast=1.04:saturation=1.06,"
        "ass=captions.ass[v]"
    ).format(duration=duration)

    if music:
        audio_filter = (
            "[1:a]volume=1.25,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS[vocal];"
            "[2:a]volume={music_volume:.3f},atrim=duration={duration:.3f},asetpts=PTS-STARTPTS[music];"
            "[vocal][music]amix=inputs=2:duration=first:dropout_transition=0,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[a]"
        ).format(duration=duration, music_volume=music_volume)
    else:
        audio_filter = (
            "[1:a]volume=1.25,atrim=duration={duration:.3f},asetpts=PTS-STARTPTS,"
            "loudnorm=I=-16:TP=-1.5:LRA=11[a]"
        ).format(duration=duration)

    run(
        [
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
            "20",
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
        ],
        cwd=out_path.parent,
    )


def extract_review_frames(video_path: Path, out_dir: Path, duration: float) -> list[Path]:
    frames: list[Path] = []
    for idx, ratio in enumerate([0.15, 0.50, 0.85], start=1):
        timestamp = max(0.1, duration * ratio)
        frame = out_dir / f"review_{idx:02d}.jpg"
        run(
            [
                "ffmpeg",
                "-y",
                "-ss",
                f"{timestamp:.3f}",
                "-i",
                str(video_path),
                "-frames:v",
                "1",
                "-update",
                "1",
                str(frame),
            ]
        )
        frames.append(frame)
    return frames


def write_text_outputs(script: ReelScript, out_dir: Path, tts_prompt: str, clean_captions: str) -> dict[str, Path]:
    paths = {
        "voiceover_raw": out_dir / "voiceover_raw.txt",
        "elevenlabs_prompt": out_dir / "elevenlabs_prompt.txt",
        "captions_clean": out_dir / "captions_clean.txt",
    }
    paths["voiceover_raw"].write_text(script.voiceover_raw, encoding="utf-8")
    paths["elevenlabs_prompt"].write_text(tts_prompt, encoding="utf-8")
    paths["captions_clean"].write_text(clean_captions, encoding="utf-8")
    if script.tiktok_description:
        path = out_dir / "tiktok_description.txt"
        path.write_text(script.tiktok_description, encoding="utf-8")
        paths["tiktok_description"] = path
    if script.facebook_description:
        path = out_dir / "facebook_description.txt"
        path.write_text(script.facebook_description, encoding="utf-8")
        paths["facebook_description"] = path
    if script.suno:
        path = out_dir / "suno_prompt.txt"
        path.write_text(script.suno, encoding="utf-8")
        paths["suno"] = path
    if script.thumbnail:
        path = out_dir / "thumbnail_prompt.txt"
        path.write_text(script.thumbnail, encoding="utf-8")
        paths["thumbnail"] = path
    return paths


def run_daily_reel2_generator(date_value: str, sign: str | None, force: bool) -> None:
    cmd = [
        sys.executable,
        str(SCRIPT_DIR / "daily_reel2.py"),
        "--write",
        "--date",
        date_value,
        "--quality",
        "standard",
    ]
    if sign:
        cmd += ["--signs", sign]
    if force:
        cmd.append("--force")
    else:
        cmd.append("--reuse-existing")
    run(cmd, cwd=SCRIPT_DIR)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a Daily Reel 2 video.")
    parser.add_argument("--date", help="Daily Reel 2 date, YYYY-MM-DD.")
    parser.add_argument("--sign", help="Zodiac sign to use when finding the script JSON.")
    parser.add_argument("--script-json", type=Path, help="Existing voiceover2_*.json file.")
    parser.add_argument("--voiceover-text-file", type=Path, help="Raw voiceover text fallback.")
    parser.add_argument("--run-generator", action="store_true", help="Run scripts/daily_reel2.py first.")
    parser.add_argument("--force-generator", action="store_true", help="Force daily_reel2.py overwrite.")
    parser.add_argument("--base-video", type=Path, help="Template/base MP4/MOV.")
    parser.add_argument("--template-dir", type=Path, help="Folder with template MP4/MOV files.")
    parser.add_argument("--music-file", type=Path, help="Optional music bed.")
    parser.add_argument("--music-dir", type=Path, help="Optional folder to auto-pick music from.")
    parser.add_argument("--voiceover-file", type=Path, help="Use an existing voiceover MP3/WAV instead of ElevenLabs.")
    parser.add_argument("--voice-id", help="ElevenLabs voice ID.")
    parser.add_argument("--voice-name", default=os.getenv("ELEVENLABS_VOICE_NAME"), help="ElevenLabs voice name lookup.")
    parser.add_argument("--model-id", default=os.getenv("ELEVENLABS_MODEL_ID", "eleven_v3"))
    parser.add_argument("--pause-mode", choices=["v3", "ssml"], default="v3")
    parser.add_argument("--skip-alignment", action="store_true", help="Use approximate captions without ElevenLabs Forced Alignment.")
    parser.add_argument("--dry-run", action="store_true", help="Prepare files and metadata without API calls/rendering.")
    parser.add_argument("--out-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--caption-font-size", type=int, default=76)
    parser.add_argument("--caption-outline", type=int, default=7)
    parser.add_argument("--caption-alignment", type=int, default=5, help="ASS alignment; 5 = center.")
    parser.add_argument("--caption-margin-v", type=int, default=0)
    parser.add_argument("--caption-max-chars", type=int, default=30)
    parser.add_argument("--caption-max-words", type=int, default=5)
    parser.add_argument("--caption-max-duration", type=float, default=2.25)
    parser.add_argument("--music-volume", type=float, default=0.13)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.date and not args.script_json and not args.voiceover_text_file:
        raise SystemExit("--date, --script-json, or --voiceover-text-file is required.")

    if args.run_generator:
        if not args.date:
            raise SystemExit("--run-generator requires --date.")
        run_daily_reel2_generator(args.date, args.sign, args.force_generator)

    if args.script_json:
        script = load_script(args.script_json)
    elif args.voiceover_text_file:
        script = read_voiceover_file(args.voiceover_text_file, args.date, args.sign)
    else:
        script = load_script(find_script_json(args.date, args.sign))

    date_value = args.date or script.date or datetime.now().strftime("%Y-%m-%d")
    sign_slug = safe_slug(script.sign)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_dir = args.out_root / f"{date_value}_{sign_slug}_{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)

    tts_prompt = normalize_for_tts(script.voiceover_raw, pause_mode=args.pause_mode)
    clean_captions = clean_for_captions(script.voiceover_raw)
    text_paths = write_text_outputs(script, out_dir, tts_prompt, clean_captions)

    base_video = find_template_video(args.base_video, args.template_dir)
    music = find_music(args.music_file, args.music_dir)
    voiceover_path = out_dir / "voiceover_elevenlabs.mp3"
    captions_path = out_dir / "captions.ass"
    alignment_path = out_dir / "alignment_elevenlabs.json"
    final_path = out_dir / "final_daily_reel2.mp4"

    metadata: dict[str, Any] = {
        "mode": "dry_run" if args.dry_run else "render",
        "date": date_value,
        "sign": script.sign,
        "source_script": str(script.source_path),
        "out_dir": str(out_dir),
        "base_video": str(base_video),
        "base_video_has_audio": ffprobe_has_audio(base_video),
        "music": str(music) if music else None,
        "model_id": args.model_id,
        "pause_mode": args.pause_mode,
        "text_outputs": {name: str(path) for name, path in text_paths.items()},
        "elevenlabs_uses_bracket_tags": bool(TAG_RE.search(tts_prompt)),
        "caption_text_has_tags": bool(TAG_RE.search(clean_captions)),
    }

    if args.dry_run:
        metadata["planned_voiceover"] = str(voiceover_path)
        metadata["planned_captions"] = str(captions_path)
        metadata["planned_final"] = str(final_path)
        metadata_path = out_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(metadata, ensure_ascii=False, indent=2))
        return 0

    if args.voiceover_file:
        if not args.voiceover_file.exists():
            raise FileNotFoundError(f"Voiceover file does not exist: {args.voiceover_file}")
        shutil.copy2(args.voiceover_file, voiceover_path)
        metadata["voiceover_source"] = str(args.voiceover_file)
    else:
        resolved_voice = elevenlabs_tts(
            text=tts_prompt,
            out_path=voiceover_path,
            voice_id=args.voice_id,
            voice_name=args.voice_name,
            model_id=args.model_id,
            dry_run=False,
        )
        metadata["voice_id"] = resolved_voice

    duration = ffprobe_duration(voiceover_path)
    metadata["duration"] = duration
    metadata["voiceover"] = str(voiceover_path)

    if args.skip_alignment:
        events = approximate_caption_events(
            clean_captions,
            duration=duration,
            max_chars=args.caption_max_chars,
            max_words=args.caption_max_words,
        )
        metadata["caption_timing"] = "approximate"
    else:
        alignment = elevenlabs_force_align(voiceover_path, clean_captions, alignment_path)
        words = words_from_alignment(alignment)
        events = caption_events_from_words(
            words,
            max_chars=args.caption_max_chars,
            max_words=args.caption_max_words,
            max_duration=args.caption_max_duration,
        )
        metadata["caption_timing"] = "elevenlabs_forced_alignment"
        metadata["alignment"] = str(alignment_path)
        metadata["alignment_word_count"] = len(words)
        metadata["alignment_loss"] = alignment.get("loss")

    write_ass_from_events(
        events,
        captions_path,
        font_size=args.caption_font_size,
        outline=args.caption_outline,
        alignment=args.caption_alignment,
        margin_v=args.caption_margin_v,
    )
    metadata["captions"] = str(captions_path)
    metadata["caption_event_count"] = len(events)

    compose_video(
        base_video=base_video,
        voiceover=voiceover_path,
        captions=captions_path,
        out_path=final_path,
        duration=duration,
        music=music,
        music_volume=args.music_volume,
    )
    metadata["final"] = str(final_path)
    metadata["review_frames"] = [str(path) for path in extract_review_frames(final_path, out_dir, duration)]

    metadata_path = out_dir / "metadata.json"
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(metadata, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
