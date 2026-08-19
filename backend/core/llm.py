"""
Local LLM access via LM Studio's OpenAI-compatible server.

Everything the app generates goes through here. Calls are async because a
local model can take minutes per request — a synchronous call inside a
FastAPI handler would block the event loop and freeze the whole server.
"""

import json
from typing import Optional, Type

from openai import AsyncOpenAI
from pydantic import BaseModel

from core.config import (
    LLM_API_KEY,
    LLM_BASE_URL,
    LLM_MODEL,
    LLM_TIMEOUT_SECONDS,
)


class LLMError(RuntimeError):
    """The local model could not be reached or refused the request."""


client = AsyncOpenAI(
    base_url=LLM_BASE_URL,
    api_key=LLM_API_KEY,
    timeout=LLM_TIMEOUT_SECONDS,
    max_retries=1,
)

_UNREACHABLE = (
    f"Could not reach a local model at {LLM_BASE_URL}. "
    "Start LM Studio, load a model, and turn on its local server "
    "(Developer tab → Start Server)."
)


def parse_json_response(text: str) -> dict:
    """
    Recover a JSON object from a model response.

    Small local models frequently ignore instructions to emit bare JSON and
    wrap it in markdown fences or add a sentence of preamble, so accept those
    shapes rather than failing the request. Raises json.JSONDecodeError when
    no JSON object can be recovered.
    """
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def _messages(prompt: str, system: Optional[str]) -> list[dict]:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    return messages


async def generate_text(
    prompt: str,
    system: Optional[str] = None,
    temperature: float = 0.7,
) -> str:
    """Plain completion. Raises LLMError if the model is unreachable."""
    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=_messages(prompt, system),
            temperature=temperature,
        )
    except Exception as exc:
        raise LLMError(_UNREACHABLE) from exc

    content = response.choices[0].message.content
    if not content:
        raise LLMError("The local model returned an empty response.")
    return content.strip()


async def generate_json(
    prompt: str,
    schema: Optional[Type[BaseModel]] = None,
    system: Optional[str] = None,
    temperature: float = 0.4,
) -> dict:
    """
    Ask the model for a JSON object, preferring grammar-constrained output.

    Structured-output support varies by model and by LM Studio version, so
    this degrades in three steps rather than failing outright: a strict JSON
    schema, then generic JSON mode, then a plain call parsed leniently.
    """
    attempts: list[Optional[dict]] = []

    if schema is not None:
        attempts.append(
            {
                "type": "json_schema",
                "json_schema": {
                    "name": schema.__name__,
                    "strict": True,
                    "schema": schema.model_json_schema(),
                },
            }
        )

    attempts.append({"type": "json_object"})
    attempts.append(None)

    system_prompt = system or "You reply with a single valid JSON object and nothing else."
    last_error: Optional[Exception] = None
    unreachable = True

    for response_format in attempts:
        kwargs = {
            "model": LLM_MODEL,
            "messages": _messages(prompt, system_prompt),
            "temperature": temperature,
        }
        if response_format is not None:
            kwargs["response_format"] = response_format

        try:
            response = await client.chat.completions.create(**kwargs)
        except Exception as exc:
            # A rejected response_format still proves the server is up, so
            # keep trying the simpler modes before blaming connectivity.
            last_error = exc
            continue

        unreachable = False
        content = response.choices[0].message.content or ""

        try:
            return parse_json_response(content)
        except json.JSONDecodeError as exc:
            last_error = exc
            continue

    if unreachable:
        raise LLMError(_UNREACHABLE) from last_error

    raise LLMError(
        f"The local model ({LLM_MODEL}) did not return usable JSON. "
        "A larger or instruction-tuned model usually fixes this."
    ) from last_error


async def llm_status() -> dict:
    """Report whether the configured model is loaded and serving."""
    try:
        models = await client.models.list()
    except Exception:
        return {"reachable": False, "model_loaded": False, "model": LLM_MODEL}

    available = [m.id for m in models.data]
    return {
        "reachable": True,
        "model_loaded": LLM_MODEL in available,
        "model": LLM_MODEL,
        "available_models": available,
    }
