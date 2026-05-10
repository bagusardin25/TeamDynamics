"""
Input sanitization helpers for user-provided text and JSON-like payloads.
"""

from __future__ import annotations

import re
from typing import Any


_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_SCRIPT_TAG = re.compile(r"</?\s*script[^>]*>", re.IGNORECASE)
_EVENT_HANDLER = re.compile(r"\s+on[a-zA-Z]+\s*=", re.IGNORECASE)
_JS_PROTOCOL = re.compile(r"javascript\s*:", re.IGNORECASE)


def sanitize_text(value: str, *, max_length: int = 1000) -> str:
    """Normalize user text and remove common script-injection vectors."""
    cleaned = _CONTROL_CHARS.sub("", value).strip()
    cleaned = _SCRIPT_TAG.sub("", cleaned)
    cleaned = _EVENT_HANDLER.sub(" ", cleaned)
    cleaned = _JS_PROTOCOL.sub("", cleaned)
    return cleaned[:max_length]


def sanitize_json_value(value: Any, *, max_string_length: int = 1000, max_depth: int = 4) -> Any:
    """Recursively sanitize JSON-compatible values before storage."""
    if max_depth < 0:
        return None
    if isinstance(value, str):
        return sanitize_text(value, max_length=max_string_length)
    if isinstance(value, list):
        return [
            sanitize_json_value(item, max_string_length=max_string_length, max_depth=max_depth - 1)
            for item in value[:50]
        ]
    if isinstance(value, dict):
        return {
            sanitize_text(str(key), max_length=80): sanitize_json_value(
                item,
                max_string_length=max_string_length,
                max_depth=max_depth - 1,
            )
            for key, item in list(value.items())[:50]
        }
    if isinstance(value, (int, float, bool)) or value is None:
        return value
    return sanitize_text(str(value), max_length=max_string_length)
