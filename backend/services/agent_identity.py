from __future__ import annotations

import re


_STATUS_OR_FEELING_TERMS = {
    "angry", "anxious", "anxiety", "burnout", "capek", "cemas",
    "depressed", "depression", "exhausted", "exhaustion", "fatigue",
    "frustrasi", "frustrated", "frustration", "kelelahan", "kecemasan",
    "kewalahan", "lelah", "marah", "overwhelmed", "panic", "panicked",
    "panik", "putus asa", "sad", "sedih", "stress", "stressed", "stres",
    "tertekan", "tired", "tiredness", "under pressure",
}
_NAME_PARTICLES = {"al", "bin", "binti", "da", "de", "del", "der", "di", "la", "van", "von"}


def _normalized_name_tokens(value: str) -> list[str]:
    return re.findall(r"[^\W_]+", value.casefold(), flags=re.UNICODE)


def is_person_name(value: str, *, strict_document_case: bool = False) -> bool:
    """Return whether a value is plausible as a person's name."""
    if not isinstance(value, str) or not value.strip():
        return False

    normalized = " ".join(_normalized_name_tokens(value))
    if not normalized:
        return False
    if normalized in _STATUS_OR_FEELING_TERMS:
        return False
    if any(token in _STATUS_OR_FEELING_TERMS for token in normalized.split()):
        return False

    if not strict_document_case:
        return True

    stripped = value.strip()
    if stripped.endswith((".", "!", "?", ",", ":", ";")):
        return False

    for part in stripped.split():
        letters = [character for character in part if character.isalpha()]
        if not letters:
            continue
        token = "".join(letters)
        if token.casefold() in _NAME_PARTICLES:
            continue
        if not letters[0].isupper():
            return False

    return True


def validate_agent_name(value: str) -> str:
    if not is_person_name(value):
        raise ValueError("Agent name must be a person's name, not a status or feeling")
    return value
