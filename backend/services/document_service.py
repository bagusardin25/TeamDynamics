"""
Document Analysis Service — extracts text from uploaded documents
and uses an LLM to generate structured analysis for simulation setup.

The uploaded document is treated as the SINGLE SOURCE OF TRUTH for the
simulation roster. This module enforces:

  • Resilient text extraction (per-page errors, DOCX tables, scanned-PDF hints)
  • Strict roster + personality validation (no silent default-filling)
  • Automatic retry when members are missing or personalities are incomplete
  • A `roster_complete` flag in the response so the frontend can gate apply
"""

from __future__ import annotations

import io
import csv
import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


# ── Tunables ─────────────────────────────────────────────────────────

# Max characters of extracted text we feed to the LLM. Roster sections
# are usually near the top of business docs (org chart, "the team"), so
# this is normally enough. Increased from 15k to give roster-heavy docs
# more room.
MAX_ANALYSIS_CHARS = 22000

# Max tokens for the LLM analysis call. Bumped from 2000 to fit a full
# 8-member roster with rationale + 5 personality traits without truncation.
ANALYSIS_MAX_TOKENS = 4000

# How many extra targeted retries we attempt when validation finds a
# missing or incomplete roster.
ROSTER_REPAIR_RETRIES = 2

# Acceptable range for personality traits.
PERSONALITY_TRAITS = ("empathy", "ambition", "stressTolerance", "agreeableness", "assertiveness")
PERSONALITY_MIN, PERSONALITY_MAX = 0, 100


# ── File extraction ──────────────────────────────────────────────────

async def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text content from uploaded files (PDF, DOCX, TXT, CSV, XLSX).

    Per-page / per-element errors are caught and logged so a single bad
    page doesn't drop the rest of the document.
    """
    ext = Path(filename).suffix.lower()
    logger.info(
        "📄 Extracting text from %s (ext=%s, size=%d bytes)",
        filename, ext, len(content),
    )

    if ext == ".txt":
        text = content.decode("utf-8", errors="replace")
        logger.info("TXT: %d chars extracted", len(text))
        return text

    if ext == ".csv":
        text = content.decode("utf-8", errors="replace")
        rows = []
        try:
            reader = csv.reader(io.StringIO(text))
            for row in reader:
                rows.append(" | ".join(row))
        except Exception as e:
            logger.warning("CSV parse error: %s — falling back to raw decode", e)
            return text
        logger.info("CSV: %d rows extracted", len(rows))
        return "\n".join(rows)

    if ext == ".pdf":
        return _extract_pdf_text(content, filename)

    if ext == ".docx":
        return _extract_docx_text(content, filename)

    if ext in (".xlsx", ".xls"):
        return _extract_xlsx_text(content, filename)

    raise ValueError(f"Unsupported file format: {ext}. Supported: PDF, DOCX, TXT, CSV, XLSX")


def _extract_pdf_text(content: bytes, filename: str) -> str:
    """PDF text extraction with per-page error isolation and a hint when
    the document looks like a scanned/image-only PDF (zero extractable text)."""
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        raise ValueError(
            "PyPDF2 is required for PDF files. Install with: pip install PyPDF2"
        )

    try:
        reader = PdfReader(io.BytesIO(content))
    except Exception as e:
        logger.error("PDF: failed to open %s: %s", filename, e)
        raise ValueError(f"Could not open PDF: {e}")

    total_pages = len(reader.pages)
    pages: list[str] = []
    skipped: list[int] = []
    for idx, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as e:
            logger.warning("PDF page %d/%d extraction error: %s", idx, total_pages, e)
            skipped.append(idx)
            continue
        if text and text.strip():
            pages.append(text)
        else:
            skipped.append(idx)

    extracted = "\n\n".join(pages)
    logger.info(
        "PDF: %d/%d pages had text, %d skipped, %d chars total",
        len(pages), total_pages, len(skipped), len(extracted),
    )
    if skipped:
        logger.debug("PDF skipped pages (no text): %s", skipped)

    if not extracted.strip():
        # Likely a scanned/image-only PDF — give the user an actionable error.
        raise ValueError(
            "Could not extract any text from this PDF. The file may be scanned "
            "or image-only — please upload a text-based PDF or convert with OCR first."
        )

    return extracted


def _extract_docx_text(content: bytes, filename: str) -> str:
    """DOCX extraction that includes paragraphs AND tables. Many roster
    documents put names/roles in tables, which the prior implementation
    silently ignored."""
    try:
        from docx import Document
    except ImportError:
        raise ValueError(
            "python-docx is required for DOCX files. Install with: pip install python-docx"
        )

    try:
        doc = Document(io.BytesIO(content))
    except Exception as e:
        logger.error("DOCX: failed to open %s: %s", filename, e)
        raise ValueError(f"Could not open DOCX: {e}")

    parts: list[str] = []

    # Paragraphs
    para_count = 0
    for p in doc.paragraphs:
        text = (p.text or "").strip()
        if text:
            parts.append(text)
            para_count += 1

    # Tables — flatten to rows of " | "-joined cells so the LLM sees the structure
    table_rows = 0
    for table in doc.tables:
        for row in table.rows:
            cells = [(cell.text or "").strip() for cell in row.cells]
            if any(cells):
                parts.append(" | ".join(cells))
                table_rows += 1

    extracted = "\n\n".join(parts)
    logger.info(
        "DOCX: %d paragraphs, %d table rows, %d chars total",
        para_count, table_rows, len(extracted),
    )

    if not extracted.strip():
        raise ValueError("DOCX appears to contain no readable text.")

    return extracted


def _extract_xlsx_text(content: bytes, filename: str) -> str:
    try:
        from openpyxl import load_workbook
    except ImportError:
        raise ValueError(
            "openpyxl is required for Excel files. Install with: pip install openpyxl"
        )

    try:
        wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    except Exception as e:
        logger.error("XLSX: failed to open %s: %s", filename, e)
        raise ValueError(f"Could not open Excel file: {e}")

    sheets_text: list[str] = []
    total_rows = 0
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows: list[str] = []
        for row in ws.iter_rows(values_only=True):
            cells = [str(c) if c is not None else "" for c in row]
            if any(cells):
                rows.append(" | ".join(cells))
        if rows:
            sheets_text.append(f"[Sheet: {sheet_name}]\n" + "\n".join(rows))
            total_rows += len(rows)
    wb.close()

    extracted = "\n\n".join(sheets_text)
    logger.info(
        "XLSX: %d sheets, %d rows total, %d chars",
        len(wb.sheetnames), total_rows, len(extracted),
    )
    return extracted


# ── Roster validation ────────────────────────────────────────────────

def _coerce_int(value: Any, default: int = 50) -> tuple[int, bool]:
    """Coerce a value into an int in PERSONALITY_MIN..PERSONALITY_MAX.
    Returns (value, was_valid)."""
    if isinstance(value, bool):
        # bool is a subtype of int — treat as missing
        return default, False
    if isinstance(value, (int, float)):
        v = int(value)
        if PERSONALITY_MIN <= v <= PERSONALITY_MAX:
            return v, True
        return max(PERSONALITY_MIN, min(PERSONALITY_MAX, v)), False
    if isinstance(value, str):
        try:
            v = int(float(value.strip()))
            if PERSONALITY_MIN <= v <= PERSONALITY_MAX:
                return v, True
            return max(PERSONALITY_MIN, min(PERSONALITY_MAX, v)), False
        except (ValueError, AttributeError):
            return default, False
    return default, False


def _validate_personality(raw: Any) -> tuple[dict, list[str]]:
    """Validate a personality dict. Returns (cleaned_dict, list_of_problems).

    A problem is recorded for any trait that is missing or out of range —
    we still produce a usable dict (clamped to the valid range), but the
    caller can see that retry is warranted.
    """
    if not isinstance(raw, dict):
        return (
            {t: 50 for t in PERSONALITY_TRAITS},
            [f"personality is not an object (got {type(raw).__name__})"],
        )

    # Tolerate snake_case alias for stress_tolerance
    if "stress_tolerance" in raw and "stressTolerance" not in raw:
        raw["stressTolerance"] = raw["stress_tolerance"]

    cleaned: dict[str, int] = {}
    problems: list[str] = []
    for trait in PERSONALITY_TRAITS:
        if trait not in raw:
            cleaned[trait] = 50
            problems.append(f"missing trait: {trait}")
            continue
        v, ok = _coerce_int(raw[trait])
        cleaned[trait] = v
        if not ok:
            problems.append(f"trait {trait}={raw[trait]!r} invalid/out-of-range")
    return cleaned, problems


def _validate_agent(agent: Any, idx: int) -> tuple[dict | None, list[str]]:
    """Validate a single suggested agent. Returns (cleaned_agent, problems).
    If `cleaned_agent` is None the agent should be DROPPED — never silently
    treated as a valid roster member."""
    if not isinstance(agent, dict):
        return None, [f"agent[{idx}] is not an object (got {type(agent).__name__})"]

    problems: list[str] = []
    name = (agent.get("name") or "").strip() if isinstance(agent.get("name"), str) else ""
    role = (agent.get("role") or "").strip() if isinstance(agent.get("role"), str) else ""
    type_ = (agent.get("type") or "").strip() if isinstance(agent.get("type"), str) else ""
    rationale = (agent.get("rationale") or "").strip() if isinstance(agent.get("rationale"), str) else ""

    if not name:
        problems.append(f"agent[{idx}] missing required field: name")
    if not role:
        problems.append(f"agent[{idx}] missing required field: role")
    if not type_:
        # Type is descriptive — fill with a generic if missing rather than dropping the agent
        type_ = "Versatile"
        problems.append(f"agent[{idx}] missing field: type (defaulted to 'Versatile')")

    # If we don't even have name + role we can't meaningfully use this agent.
    if not name or not role:
        return None, problems

    personality, p_problems = _validate_personality(agent.get("personality"))
    problems.extend(f"agent[{idx}] {p}" for p in p_problems)

    return (
        {
            "name": name,
            "role": role,
            "type": type_,
            "rationale": rationale,
            "personality": personality,
        },
        problems,
    )


def _validate_roster(suggested_agents: Any) -> tuple[list[dict], list[str], dict]:
    """Validate the full roster. Returns (cleaned_list, problems, stats).

    - cleaned_list: only agents that passed structural validation
    - problems: human-readable issues
    - stats: { total_received, accepted, dropped, incomplete_personalities }
    """
    if not isinstance(suggested_agents, list):
        return [], [
            f"suggested_agents must be a list (got {type(suggested_agents).__name__})"
        ], {"total_received": 0, "accepted": 0, "dropped": 0, "incomplete_personalities": 0}

    cleaned: list[dict] = []
    problems: list[str] = []
    incomplete = 0
    dropped = 0
    for i, raw in enumerate(suggested_agents):
        agent, agent_problems = _validate_agent(raw, i)
        if any("personality" in p or "trait" in p for p in agent_problems):
            incomplete += 1
        problems.extend(agent_problems)
        if agent is None:
            dropped += 1
            continue
        cleaned.append(agent)

    stats = {
        "total_received": len(suggested_agents),
        "accepted": len(cleaned),
        "dropped": dropped,
        "incomplete_personalities": incomplete,
    }
    return cleaned, problems, stats


# ── LLM prompts ──────────────────────────────────────────────────────

def _build_analysis_system_prompt() -> str:
    return """You are an expert organizational analyst AI. You analyze business documents to extract useful information for a team-dynamics simulation.

The uploaded document is the SINGLE SOURCE OF TRUTH for the simulation roster. Extract EVERY team member named or implied by the document — do not invent extras and do not silently drop any.

Respond ONLY with valid JSON in this exact shape (no markdown, no prose):
{
  "company_name": "Company / org name from the doc, or a sensible inference if not stated.",
  "company_culture": "1-2 sentences describing the work environment / org context.",
  "summary": "2-3 sentence summary of what the document is about.",
  "key_requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "team_risks": ["risk 1", "risk 2", "risk 3"],
  "suggested_crisis": {
    "title": "Short crisis title derived from the document",
    "description": "1-2 sentence realistic crisis derived from this context"
  },
  "suggested_agents": [
    {
      "name": "Realistic first name (e.g., Alex, Sam, Jordan). Use the document's actual name when given.",
      "role": "Role title (e.g., Tech Lead, Product Manager) — REQUIRED, must be non-empty",
      "type": "Personality archetype (e.g., 'Ambitious & Driven', 'Strict & Methodical')",
      "rationale": "Why this role is needed based on the document",
      "personality": {
        "empathy": 50,
        "ambition": 50,
        "stressTolerance": 50,
        "agreeableness": 50,
        "assertiveness": 50
      }
    }
  ],
  "suggested_team_rules": ["rule 1", "rule 2", "rule 3"],
  "actionable_insights": ["insight 1", "insight 2", "insight 3"]
}

ROSTER RULES (strict):
1. Include EVERY team member named or strongly implied by the document. Do not skip any.
2. Hard cap: at most 8 members. If the document has more than 8, pick the 8 most central to the crisis and list the rest in `actionable_insights` (e.g., "Additional members noted but capped: …").
3. Every agent MUST have all five personality traits, each an integer 0-100.
4. Every agent MUST have a non-empty `name`, `role`, and `type`. Never emit blanks or placeholders like "TBD".
5. Personality values must reflect the role + context (e.g., a Junior Dev in a stressful startup → high ambition, lower stressTolerance).
6. Output ONLY the JSON object — no commentary, no markdown fences."""


def _build_repair_user_prompt(text_excerpt: str, current_roster: list[dict],
                              problems: list[str]) -> str:
    """Targeted second-pass prompt asking the LLM to fix only the bad entries."""
    issues_text = "\n".join(f"- {p}" for p in problems[:25])  # cap noise
    current_json = json.dumps(current_roster, ensure_ascii=False, indent=2)
    return f"""Your previous roster extraction had problems. Re-emit the FULL roster JSON object with all issues fixed. Do NOT drop members; ADD missing personality traits and fill missing names/roles based on the document context.

Issues detected:
{issues_text}

Current roster (to be repaired and returned in full):
{current_json}

DOCUMENT (excerpt):
{text_excerpt}

Respond ONLY with the same top-level JSON object the first call expected, with `suggested_agents` fully populated and every personality trait present (empathy, ambition, stressTolerance, agreeableness, assertiveness — integers 0-100)."""


# ── Public API ───────────────────────────────────────────────────────

DEFAULT_PERSONALITY = {t: 50 for t in PERSONALITY_TRAITS}


def _empty_analysis(reason: str) -> dict:
    return {
        "company_name": "",
        "company_culture": "",
        "summary": reason,
        "key_requirements": [],
        "team_risks": [],
        "suggested_crisis": {
            "title": "Custom Crisis",
            "description": "Please define a crisis scenario manually.",
        },
        "suggested_agents": [],
        "suggested_team_rules": [],
        "actionable_insights": [],
        "roster_complete": False,
        "roster_stats": {
            "total_received": 0,
            "accepted": 0,
            "dropped": 0,
            "incomplete_personalities": 0,
        },
        "roster_problems": [],
    }


async def analyze_document(text: str, filename: str) -> dict:
    """Analyze extracted document text via the LLM and return structured
    setup data with a strictly-validated roster."""
    from services.llm_service import _dispatch_llm_call, LLM_PROVIDER

    # Truncate text to a reasonable size (with a marker so the LLM knows it was cut)
    truncated = text[:MAX_ANALYSIS_CHARS]
    if len(text) > MAX_ANALYSIS_CHARS:
        truncated += "\n\n[... document truncated for analysis ...]"

    system_prompt = _build_analysis_system_prompt()
    user_prompt = (
        f"Analyze this document for team-dynamics simulation setup.\n\n"
        f"FILENAME: {filename}\n\n"
        f"DOCUMENT CONTENT:\n{truncated}\n\n"
        f"Generate the structured analysis. The roster MUST include every named/implied team member "
        f"(up to 8). Every agent MUST include a complete personality with all 5 traits as integers 0-100."
    )

    logger.info(
        "🧠 Analyzing %s (text_chars=%d, sent_to_llm=%d)",
        filename, len(text), len(truncated),
    )

    # ── First pass ───────────────────────────────────────────────────
    try:
        result = await _dispatch_llm_call(
            system_prompt, user_prompt, LLM_PROVIDER,
            max_tokens=ANALYSIS_MAX_TOKENS,
        )
    except Exception as e:
        logger.error("Document analysis LLM call failed: %s", e)
        empty = _empty_analysis(
            "Document was uploaded but AI analysis encountered an error. Please retry."
        )
        empty["roster_problems"] = [str(e)]
        return empty

    # Apply top-level defaults so the rest of the function is null-safe.
    result.setdefault("company_name", "")
    result.setdefault("company_culture", "")
    result.setdefault("summary", "Document analyzed successfully.")
    result.setdefault("key_requirements", [])
    result.setdefault("team_risks", [])
    result.setdefault("suggested_crisis", {
        "title": "Custom Crisis",
        "description": "A crisis derived from the document.",
    })
    result.setdefault("suggested_agents", [])
    result.setdefault("suggested_team_rules", [])
    result.setdefault("actionable_insights", [])

    cleaned, problems, stats = _validate_roster(result.get("suggested_agents"))
    logger.info(
        "Roster v1: received=%d accepted=%d dropped=%d incomplete=%d",
        stats["total_received"], stats["accepted"], stats["dropped"],
        stats["incomplete_personalities"],
    )
    if problems:
        logger.debug("Roster v1 problems (first 10): %s", problems[:10])

    # ── Repair retries ───────────────────────────────────────────────
    attempt = 0
    while attempt < ROSTER_REPAIR_RETRIES and (
        not cleaned or stats["dropped"] > 0 or stats["incomplete_personalities"] > 0
    ):
        attempt += 1
        logger.warning(
            "Roster needs repair (attempt %d/%d): accepted=%d dropped=%d incomplete=%d",
            attempt, ROSTER_REPAIR_RETRIES,
            stats["accepted"], stats["dropped"], stats["incomplete_personalities"],
        )
        try:
            repair_user = _build_repair_user_prompt(
                truncated[:8000],  # smaller excerpt for the retry to keep tokens manageable
                cleaned or result.get("suggested_agents") or [],
                problems,
            )
            repaired = await _dispatch_llm_call(
                system_prompt, repair_user, LLM_PROVIDER,
                max_tokens=ANALYSIS_MAX_TOKENS,
            )
        except Exception as e:
            logger.error("Roster repair attempt %d failed: %s", attempt, e)
            break

        # Merge repaired top-level fields if they were re-emitted
        for k in (
            "company_name", "company_culture", "summary",
            "key_requirements", "team_risks", "suggested_crisis",
            "suggested_team_rules", "actionable_insights",
        ):
            if repaired.get(k):
                result[k] = repaired[k]

        repaired_roster = repaired.get("suggested_agents")
        if not repaired_roster:
            logger.warning("Repair attempt %d returned no roster — stopping", attempt)
            break

        cleaned, problems, stats = _validate_roster(repaired_roster)
        logger.info(
            "Roster v%d: received=%d accepted=%d dropped=%d incomplete=%d",
            attempt + 1,
            stats["total_received"], stats["accepted"], stats["dropped"],
            stats["incomplete_personalities"],
        )

    # ── Finalize ─────────────────────────────────────────────────────
    # Cap to 8 (matches CreateSimulationRequest schema). Surface a warning
    # in actionable_insights if we had to truncate so it's visible to the user.
    MAX_ROSTER = 8
    if len(cleaned) > MAX_ROSTER:
        extra = [a["name"] for a in cleaned[MAX_ROSTER:]]
        cleaned = cleaned[:MAX_ROSTER]
        note = (
            f"Roster capped at {MAX_ROSTER}. Additional members not added: "
            + ", ".join(extra)
        )
        result.setdefault("actionable_insights", []).insert(0, note)
        logger.info("Roster capped to %d, dropped overflow: %s", MAX_ROSTER, extra)

    roster_complete = (
        len(cleaned) > 0
        and stats["dropped"] == 0
        and stats["incomplete_personalities"] == 0
    )

    result["suggested_agents"] = cleaned
    result["roster_complete"] = roster_complete
    result["roster_stats"] = stats
    result["roster_problems"] = problems[:50]  # cap to avoid huge payloads

    logger.info(
        "✅ Analysis complete for %s — final_roster=%d, complete=%s",
        filename, len(cleaned), roster_complete,
    )

    return result
