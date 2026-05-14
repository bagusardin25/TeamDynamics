"""
Document upload & analysis routes.
"""

import logging
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from services.document_service import extract_text_from_file, analyze_document

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/document", tags=["document"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt", ".csv", ".xlsx", ".xls"}


@router.post("/analyze")
async def upload_and_analyze(file: UploadFile = File(...)):
    """Upload a document and analyze it with AI for simulation setup.

    The response contains a strictly-validated roster. Callers (the setup
    wizard) should treat the analysis as the SINGLE SOURCE OF TRUTH for
    the simulation roster — replacing any prior roster state, not merging.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    logger.info(
        "📥 /document/analyze: filename=%s ext=%s size=%d",
        file.filename, ext, len(content),
    )

    try:
        text = await extract_text_from_file(content, file.filename)
        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the file. Please check the file content.",
            )

        analysis = await analyze_document(text, file.filename)

        # Top-level summary for log + monitoring
        roster_count = len(analysis.get("suggested_agents", []) or [])
        roster_complete = bool(analysis.get("roster_complete", False))
        roster_stats = analysis.get("roster_stats", {}) or {}
        logger.info(
            "📤 /document/analyze response: filename=%s text_chars=%d roster=%d complete=%s stats=%s",
            file.filename, len(text), roster_count, roster_complete, roster_stats,
        )

        return {
            "filename": file.filename,
            "file_size": len(content),
            "extracted_length": len(text),
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except ValueError as e:
        # Surfaced from extractors when the file is unreadable/scanned/etc.
        logger.warning("Document analysis ValueError for %s: %s", file.filename, e)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Document analysis crashed for %s: %s", file.filename, e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
