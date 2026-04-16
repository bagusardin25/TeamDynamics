"""
Document Analysis Service — extracts text from uploaded documents
and uses LLM to generate structured analysis for simulation setup.
"""

from __future__ import annotations

import io
import csv
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text content from uploaded files (PDF, DOCX, TXT, CSV, XLSX)."""
    ext = Path(filename).suffix.lower()

    if ext == ".txt":
        return content.decode("utf-8", errors="replace")

    elif ext == ".csv":
        text = content.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = []
        for row in reader:
            rows.append(" | ".join(row))
        return "\n".join(rows)

    elif ext == ".pdf":
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(content))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages)
        except ImportError:
            raise ValueError("PyPDF2 is required for PDF files. Install with: pip install PyPDF2")

    elif ext in (".docx",):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except ImportError:
            raise ValueError("python-docx is required for DOCX files. Install with: pip install python-docx")

    elif ext in (".xlsx", ".xls"):
        try:
            from openpyxl import load_workbook
            wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
            sheets_text = []
            for sheet_name in wb.sheetnames:
                ws = wb[sheet_name]
                rows = []
                for row in ws.iter_rows(values_only=True):
                    cells = [str(c) if c is not None else "" for c in row]
                    if any(cells):
                        rows.append(" | ".join(cells))
                if rows:
                    sheets_text.append(f"[Sheet: {sheet_name}]\n" + "\n".join(rows))
            wb.close()
            return "\n\n".join(sheets_text)
        except ImportError:
            raise ValueError("openpyxl is required for Excel files. Install with: pip install openpyxl")

    else:
        raise ValueError(f"Unsupported file format: {ext}. Supported: PDF, DOCX, TXT, CSV, XLSX")


async def analyze_document(text: str, filename: str) -> dict:
    """
    Use LLM to analyze extracted document text and generate structured output
    for simulation setup assistance.
    """
    from services.llm_service import _dispatch_llm_call, LLM_PROVIDER

    # Truncate text to avoid token limits (roughly 15k chars)
    truncated = text[:15000]
    if len(text) > 15000:
        truncated += "\n\n[... document truncated for analysis ...]"

    system_prompt = """You are an expert organizational analyst AI. You analyze business documents to extract useful information for team dynamics simulation.

Given a document, extract and structure the following information. Respond ONLY with valid JSON:
{
  "company_name": "The company or organization name mentioned in the document. If not explicitly stated, infer a suitable name from context.",
  "company_culture": "1-2 sentence description of the company culture, work environment, or organizational context extracted from the document.",
  "summary": "A 2-3 sentence summary of what this document is about",
  "key_requirements": ["requirement 1", "requirement 2", "requirement 3"],
  "team_risks": ["risk 1", "risk 2", "risk 3"],
  "suggested_crisis": {
    "title": "A crisis scenario title derived from the document",
    "description": "1-2 sentence description of a realistic crisis that could emerge from this context"
  },
  "suggested_agents": [
    {
      "name": "A realistic first name for this team member (e.g., Alex, Sam, Jordan)",
      "role": "Suggested team role (e.g., Tech Lead, Product Manager)",
      "type": "Personality type descriptor (e.g., Ambitious & Driven, Strict & Methodical)",
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

Rules:
1. Extract SPECIFIC information from the document, not generic advice
2. Team risks should relate to actual content in the document
3. The suggested crisis should be realistic and derived from document context
4. Suggest 2-4 team roles that would be relevant to this document's content
5. Keep all text concise and actionable
6. If the document is not related to business/team/project, still try to extract useful team simulation insights
7. For company_name: extract the actual company name from the document. If no company name is found, create a meaningful name based on the document's industry/context
8. For company_culture: describe the work environment and organizational dynamics based on what the document reveals
9. For each suggested agent, assign personality trait values (0-100) that realistically match their role and type. A Tech Lead might have high assertiveness, a Junior Dev might have high ambition but low stress tolerance, etc.
10. For suggested_team_rules: extract or infer 2-4 team operating rules/norms that would be relevant based on the document context"""

    user_prompt = f"""Analyze this document for team dynamics simulation setup:

FILENAME: {filename}

DOCUMENT CONTENT:
{truncated}

Generate structured analysis. Pay special attention to extracting the company/organization name, describing the company culture, and suggesting realistic team members with appropriate personality traits."""

    try:
        result = await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER, max_tokens=2000)

        # Ensure all expected fields exist
        result.setdefault("company_name", "")
        result.setdefault("company_culture", "")
        result.setdefault("summary", "Document analyzed successfully.")
        result.setdefault("key_requirements", [])
        result.setdefault("team_risks", [])
        result.setdefault("suggested_crisis", {"title": "Custom Crisis", "description": "A crisis derived from the document."})
        result.setdefault("suggested_agents", [])
        result.setdefault("suggested_team_rules", [])
        result.setdefault("actionable_insights", [])

        # Ensure each suggested agent has all expected fields
        for agent in result.get("suggested_agents", []):
            agent.setdefault("name", "Agent")
            agent.setdefault("role", "Team Member")
            agent.setdefault("type", "Versatile")
            agent.setdefault("rationale", "")
            agent.setdefault("personality", {
                "empathy": 50, "ambition": 50, "stressTolerance": 50,
                "agreeableness": 50, "assertiveness": 50,
            })

        return result

    except Exception as e:
        logger.error(f"Document analysis LLM call failed: {e}")
        return {
            "company_name": "",
            "company_culture": "",
            "summary": "Document was uploaded but AI analysis encountered an error.",
            "key_requirements": ["Unable to extract requirements automatically."],
            "team_risks": ["Retry the analysis or review the document manually."],
            "suggested_crisis": {"title": "Custom Crisis", "description": "Please define a crisis scenario manually."},
            "suggested_agents": [],
            "suggested_team_rules": [],
            "actionable_insights": ["Review the document manually for simulation setup."],
        }
