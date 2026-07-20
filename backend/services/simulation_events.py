"""Typed presentation metadata for simulation system messages.

The database keeps the existing message schema for compatibility. Messages are
enriched at API and WebSocket boundaries so old replays and new live sessions
share the same event contract.
"""

from __future__ import annotations

from copy import deepcopy
import re
from typing import Any

_DECORATIVE_EMOJI_RE = re.compile(
    "["
    "\U0001F1E6-\U0001F1FF"
    "\U0001F300-\U0001FAFF"
    "\u2600-\u27BF"
    "\uFE0F"
    "\u200D"
    "]"
)
_NEGATIVE_METRICS = {
    "stress",
    "technical debt",
    "resignation",
    "resignations",
}


def strip_decorative_emoji(value: str) -> str:
    """Remove decorative pictographs while preserving readable punctuation."""
    cleaned = _DECORATIVE_EMOJI_RE.sub("", value)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    return cleaned.strip()


def _effect_tone(label: str, value: str) -> str:
    match = re.search(r"[+-]?\d+(?:\.\d+)?", value)
    if not match:
        return "neutral"
    amount = float(match.group())
    if amount == 0:
        return "neutral"
    improves_state = (
        amount < 0 if label.lower() in _NEGATIVE_METRICS else amount > 0
    )
    return "positive" if improves_state else "negative"


def _parse_effects(value: str) -> list[dict[str, str]]:
    effects = []
    for match in re.finditer(
        r"(?:^|,\s*)([^,:]+):\s*([+-]?\d+(?:\.\d+)?%?)",
        value,
    ):
        label = match.group(1).strip()
        amount = match.group(2).strip()
        effects.append(
            {
                "label": label,
                "value": amount,
                "tone": _effect_tone(label, amount),
            }
        )
    return effects


def _event(
    kind: str,
    title: str,
    summary: str,
    severity: str = "info",
    effects: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    return {
        "kind": kind,
        "title": title,
        "summary": summary,
        "severity": severity,
        "effects": effects or [],
    }


def classify_system_event(content: str) -> dict[str, Any]:
    """Classify legacy text and return typed presentation metadata."""
    clean = strip_decorative_emoji(content)
    upper = clean.upper()

    if "SIMULATION OUTCOME:" in upper:
        outcome = re.split(
            r"SIMULATION OUTCOME:", clean, maxsplit=1, flags=re.IGNORECASE
        )[1].strip()
        lines = [
            line.strip()
            for line in outcome.splitlines()
            if line.strip() and not re.fullmatch(r"=+", line.strip())
        ]
        title = re.sub(r"^=+\s*|\s*=+$", "", lines[0]) if lines else "Outcome"
        description = " ".join(lines[1:])
        description = re.split(
            r"FINAL WORLD STATE:", description, maxsplit=1, flags=re.IGNORECASE
        )[0].strip()
        return _event("outcome", title, description, "success")

    if "TEAM DECISION REACHED:" in upper:
        summary = re.split(
            r"TEAM DECISION REACHED:", clean, maxsplit=1, flags=re.IGNORECASE
        )[1].strip()
        return _event("decision", "Team Decision", summary, "success")

    phase = re.match(
        r"^Phase Shift\s*(?:→|->)\s*([^:]+):\s*([\s\S]*)$",
        clean,
        flags=re.IGNORECASE,
    )
    if phase:
        return _event(
            "phase_shift", phase.group(1).strip(), phase.group(2).strip()
        )

    unexpected = re.match(
        r"^UNEXPECTED EVENT:\s*([^\n]*)(?:\n+([\s\S]*))?$",
        clean,
        flags=re.IGNORECASE,
    )
    if unexpected:
        description = (unexpected.group(2) or "").strip()
        title = unexpected.group(1).strip() if description else "Unexpected Event"
        summary = description or unexpected.group(1).strip()
        return _event("unexpected_event", title, summary, "warning")

    crisis = re.match(
        r"^(CRITICAL INCIDENT|ANNOUNCEMENT|URGENT|BREAKING|CRISIS):\s*([\s\S]*)$",
        clean,
        flags=re.IGNORECASE,
    )
    if crisis:
        label = crisis.group(1).upper()
        title = {
            "CRITICAL INCIDENT": "Critical Incident",
            "CRISIS": "Crisis",
        }.get(label, label.capitalize())
        return _event("crisis", title, crisis.group(2).strip(), "critical")

    proposal = re.match(
        r"^(.+?) has proposed:\s*([\s\S]*)$", clean, flags=re.IGNORECASE
    )
    if proposal:
        return _event(
            "proposal",
            f"{proposal.group(1).strip()} proposed a plan",
            proposal.group(2).strip(),
        )

    impact = re.match(
        r"^Impact of (.+?)'s action:\s*([\s\S]*)$",
        clean,
        flags=re.IGNORECASE,
    )
    if impact:
        return _event(
            "impact",
            "Action Impact",
            f"{impact.group(1).strip()}'s action changed the project state.",
            effects=_parse_effects(impact.group(2)),
        )

    intervention = re.match(
        r"^(?:GOD MODE|MANAGEMENT(?: ANNOUNCEMENT)?):\s*([\s\S]*)$",
        clean,
        flags=re.IGNORECASE,
    )
    if intervention:
        return _event(
            "intervention",
            "God Mode Intervention",
            intervention.group(1).strip(),
            "warning",
        )

    if re.search(
        r"opposes the current proposal|escalated to management|"
        r"resignation|pointing fingers",
        clean,
        flags=re.IGNORECASE,
    ):
        return _event("team_signal", "Team Signal", clean, "warning")

    return _event("update", "System Update", clean)


def enrich_system_message(message: dict[str, Any]) -> dict[str, Any]:
    """Return a serializable copy enriched with event metadata."""
    if message.get("type") != "system":
        return message

    enriched = deepcopy(message)
    enriched["content"] = strip_decorative_emoji(
        str(enriched.get("content", ""))
    )
    enriched.setdefault("event", classify_system_event(enriched["content"]))
    return enriched


def enrich_system_messages(
    messages: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    return [enrich_system_message(message) for message in messages]
