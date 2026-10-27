"""Bounded OpenAI Realtime narration and independently transcribed word timing.

Docs checked 2026-10-27: /guides/realtime-conversations,
/guides/realtime-websocket and /guides/speech-to-text on developers.openai.com.
Whisper timestamps are transcription, not forced alignment. No automatic retries.
"""
from __future__ import annotations

import base64
import json
import math
import os
import re
import time
import unicodedata
import wave
from pathlib import Path
from urllib.parse import urlencode

import requests

DEFAULT_MODEL = "gpt-realtime-2.1-mini"
DEFAULT_VOICE = "marin"
DISCLOSURE = "Hlas byl vytvořen umělou inteligencí (OpenAI)."
TAG_RE = re.compile(r"\[([^\[\]\n]+)\]")
BREAK_RE = re.compile(r"<break\b[^>]*?/>", re.I)


def prepare_narration(raw: str) -> tuple[str, str]:
    tags = list(dict.fromkeys(TAG_RE.findall(raw)))
    text = TAG_RE.sub("", raw)
    text = BREAK_RE.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    instructions = (
        "Read the provided Czech narration exactly, without adding an introduction, "
        "commentary, translation or omissions. Speak natural Czech with a calm, warm, "
        "clear voice and unhurried phrasing. Do not read delivery directions aloud."
    )
    if tags:
        instructions += " Delivery directions, in order: " + "; ".join(tags) + "."
    return text, instructions


def _key() -> str:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("Missing OPENAI_API_KEY.")
    return key


def synthesize_narration(text: str, out_path: Path, *, voice: str = DEFAULT_VOICE,
                         model: str = DEFAULT_MODEL, instructions: str = "",
                         dry_run: bool = False, timeout: float = 180) -> None:
    """One WebSocket response, max 6000 characters/180s audio/4096 output tokens."""
    if not text.strip() or len(text) > 6000:
        raise ValueError("Narration must contain 1–6000 characters.")
    if not math.isfinite(timeout) or not 0 < timeout <= 180:
        raise ValueError("Audio timeout must be between 0 and 180 seconds.")
    if dry_run:
        return  # Never load credentials or connect for a preview.
    key = _key()
    import websocket  # websocket-client; optional for dry-run and supplied files

    deadline = time.monotonic() + timeout
    ws = websocket.create_connection(
        "wss://api.openai.com/v1/realtime?" + urlencode({"model": model}),
        header=["Authorization: Bearer " + key], timeout=min(30, timeout),
    )
    pcm = bytearray()
    try:
        ws.send(json.dumps({"type": "session.update", "session": {
            "type": "realtime", "output_modalities": ["audio"],
            "audio": {"output": {"format": {"type": "audio/pcm", "rate": 24000},
                                 "voice": voice}},
        }}))
        # Wait for the server to accept voice/format before requesting billable output.
        started = False
        response_id = None
        for _ in range(10000):
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError("OpenAI narration exceeded its total time limit.")
            ws.settimeout(min(30, remaining))
            raw = ws.recv()
            if not raw:
                raise RuntimeError("OpenAI audio connection closed before completion.")
            if len(raw) > 2_000_000:
                raise RuntimeError("OpenAI audio event exceeds size limit.")
            event = json.loads(raw)
            kind = event.get("type")
            if kind == "error":
                # Do not expose server messages that may include request or auth details.
                raise RuntimeError("OpenAI Realtime rejected the narration request.")
            if kind == "session.updated" and not started:
                ws.send(json.dumps({"type": "response.create", "response": {
                    "conversation": "none", "input": [], "output_modalities": ["audio"],
                    "max_output_tokens": 4096,
                    "instructions": instructions + "\nRead exactly this narration:\n" + text,
                }}, ensure_ascii=False))
                started = True
            elif kind == "response.created":
                if not started or response_id is not None:
                    raise RuntimeError("Unexpected OpenAI response stream.")
                response_id = event.get("response", {}).get("id")
                if not response_id:
                    raise RuntimeError("OpenAI response has no identifier.")
            elif kind == "response.output_audio.delta":
                if not started or not response_id or event.get("response_id") != response_id:
                    raise RuntimeError("Unexpected audio response stream.")
                pcm.extend(base64.b64decode(event.get("delta", ""), validate=True))
                if len(pcm) > 24000 * 2 * 180:
                    raise RuntimeError("OpenAI narration exceeds the 180-second audio limit.")
            elif kind == "response.done":
                if (not started or not response_id
                        or event.get("response", {}).get("id") != response_id
                        or event.get("response", {}).get("status") != "completed"):
                    raise RuntimeError("OpenAI narration did not complete; no audio saved.")
                if not pcm or len(pcm) % 2:
                    raise RuntimeError("OpenAI returned empty or invalid PCM audio.")
                break
        else:
            raise RuntimeError("OpenAI audio event limit exceeded.")
    finally:
        ws.close()
    # Write only after successful completion; never leave a partial WAV.
    with wave.open(str(out_path), "wb") as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(24000)
        audio.writeframes(pcm)


def _tokens(text: str) -> list[str]:
    return re.findall(r"\w+", unicodedata.normalize("NFC", text).casefold(), re.UNICODE)


def validate_word_timing(payload: dict, expected: str, *, duration: float) -> list[dict]:
    """Require the same words, ignoring case/punctuation only; never repair guesses."""
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Audio duration must be finite and positive.")
    words = payload.get("words")
    if not words or not isinstance(words, list):
        raise ValueError("OpenAI transcription returned no word timestamps.")
    if any(not isinstance(w, dict) or not isinstance(w.get("word"), str) for w in words):
        raise ValueError("Malformed transcription words.")
    if _tokens(str(payload.get("text", ""))) != _tokens(expected):
        raise ValueError("Transcription differs from narration. Review audio/text or explicitly use approximate captions.")
    if _tokens(" ".join(str(w.get("word", "")) for w in words)) != _tokens(expected):
        raise ValueError("Timestamp words differ from narration; captions were not generated.")
    result = []
    previous_end = 0.0
    for word in words:
        start, end = word.get("start"), word.get("end")
        if (isinstance(start, bool) or isinstance(end, bool)
                or not isinstance(start, (int, float)) or not isinstance(end, (int, float))
                or not math.isfinite(start) or not math.isfinite(end)
                or start < previous_end or end <= start or end > duration + 0.15):
            raise ValueError("Invalid, overlapping or out-of-range transcription timestamps.")
        result.append({"text": word["word"].strip(), "start": float(start), "end": float(end)})
        previous_end = end
    return result


def transcribe_word_timing(audio_path: Path, text: str, out_path: Path, *, duration: float) -> dict:
    if audio_path.stat().st_size > 24_000_000:
        raise ValueError("Audio exceeds the transcription upload limit.")
    key = _key()
    with audio_path.open("rb") as audio:
        response = requests.post("https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": "Bearer " + key},
            files={"file": (audio_path.name, audio)},
            data={"model": "whisper-1", "response_format": "verbose_json",
                  "timestamp_granularities[]": "word", "language": "cs"},
            timeout=(10, 180))
    response.raise_for_status()
    payload = response.json()
    words = validate_word_timing(payload, text, duration=duration)
    result = {"provider": "openai", "model": "whisper-1",
              "method": "validated_transcription_word_timestamps", "words": words,
              "transcript": payload["text"]}
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return result
