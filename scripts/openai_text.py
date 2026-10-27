"""OpenAI-only text transport for standalone content scripts."""

import requests


def call_openai_text(api_key, system, user, *, max_tokens, model="gpt-6-luna"):
    if model != "gpt-6-luna":
        raise ValueError("Text generation requires gpt-6-luna")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required")
    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "instructions": system,
            "input": [{"role": "user", "content": user}],
            "max_output_tokens": max_tokens,
            "reasoning": {"effort": "none"},
            "store": False,
        },
        timeout=90,
    )
    # Do not include provider bodies, which can contain private prompt fragments.
    if not response.ok:
        raise RuntimeError(f"OpenAI request failed ({response.status_code})")
    data = response.json()
    if data.get("status") != "completed" or data.get("error"):
        raise RuntimeError("OpenAI returned an incomplete response")
    chunks = []
    for item in data.get("output", []):
        if item.get("type") == "reasoning":
            continue
        if item.get("type") != "message" or item.get("role") != "assistant" or item.get("status") != "completed":
            raise RuntimeError("OpenAI returned unsupported output")
        for part in item.get("content", []):
            if part.get("type") != "output_text" or not isinstance(part.get("text"), str):
                raise RuntimeError("OpenAI returned unsupported content")
            chunks.append(part["text"])
    text = "".join(chunks).strip()
    if not text:
        raise RuntimeError("OpenAI returned no text output")
    return text
