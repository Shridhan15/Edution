import os
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_MODEL = "openai/gpt-oss-120b"

LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_FILE = LOG_DIR / "llm_calls.log"

_groq_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _groq_client
    if _groq_client is None:
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is missing in .env")
        _groq_client = Groq(api_key=GROQ_API_KEY)
    return _groq_client


def _write_log_entry(
    *,
    timestamp: str,
    source: str,
    model: str,
    status: str,
    latency_ms: float,
    input_tokens: int,
    output_tokens: int,
    total_tokens: int,
    system_prompt: Optional[str],
    user_prompt: str,
    response_text: str,
    error: Optional[str] = None,
):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    separator = "=" * 80
    sub_sep = "-" * 80

    lines = [
        separator,
        f"TIME          : {timestamp}",
        f"SOURCE        : {source}",
        f"MODEL         : {model}",
        f"STATUS        : {status}",
        f"LATENCY       : {latency_ms:.1f} ms ({latency_ms / 1000:.2f} s)",
        f"TOKENS        : input={input_tokens} | output={output_tokens} | total={total_tokens}",
        sub_sep,
    ]
    if system_prompt:
        lines.append(f"[SYSTEM PROMPT]\n{system_prompt}\n")
    lines.append(f"[USER QUERY / PROMPT]\n{user_prompt}\n")
    if error:
        lines.append(f"[ERROR]\n{error}\n")
    else:
        lines.append(f"[RESPONSE]\n{response_text}\n")
    lines.append(separator + "\n")

    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write("\n".join(lines))


def call_llm(
    *,
    source: str,
    user_prompt: str,
    system_prompt: Optional[str] = None,
    model: str = DEFAULT_MODEL,
    temperature: float = 0.0,
    json_mode: bool = False,
) -> str:
    """Centralized LLM call that logs every request/response to backend/logs/llm_calls.log."""
    client = _get_client()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": user_prompt})

    kwargs = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    t0 = time.perf_counter()
    try:
        resp = client.chat.completions.create(**kwargs)
        latency_ms = (time.perf_counter() - t0) * 1000

        content = resp.choices[0].message.content or ""
        usage = resp.usage
        in_tok = getattr(usage, "prompt_tokens", 0) or 0
        out_tok = getattr(usage, "completion_tokens", 0) or 0
        tot_tok = getattr(usage, "total_tokens", in_tok + out_tok) or 0

        _write_log_entry(
            timestamp=timestamp,
            source=source,
            model=model,
            status="SUCCESS",
            latency_ms=latency_ms,
            input_tokens=in_tok,
            output_tokens=out_tok,
            total_tokens=tot_tok,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_text=content,
        )
        return content

    except Exception as exc:
        latency_ms = (time.perf_counter() - t0) * 1000
        _write_log_entry(
            timestamp=timestamp,
            source=source,
            model=model,
            status="ERROR",
            latency_ms=latency_ms,
            input_tokens=0,
            output_tokens=0,
            total_tokens=0,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_text="",
            error=str(exc),
        )
        raise