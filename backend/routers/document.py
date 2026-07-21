"""
Document upload & analysis routes.
"""

import logging

from fastapi import APIRouter, UploadFile, File, HTTPException

from models.document import DocumentAnalysisError
from services.document_service import (
    DocumentExtractionError,
    analyze_document,
    extract_text_from_file,
)

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/api/document", tags=["document"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".xlsx"}


@router.post("/analyze")
async def upload_and_analyze(file: UploadFile = File(...)):
    """Upload a document and analyze it with AI for simulation setup."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    # Check extension
    from pathlib import Path
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read content with size limit
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB.",
        )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    try:
        # Extract text
        text = await extract_text_from_file(content, file.filename)
        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from the file. Please check the file content.",
            )

        # Analyze with AI
        analysis = await analyze_document(text, file.filename)

        return {
            "filename": file.filename,
            "file_size": len(content),
            "extracted_length": len(text),
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except DocumentExtractionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DocumentAnalysisError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected document processing failure")
        raise HTTPException(
            status_code=500,
            detail="Document processing failed. Please try again.",
        ) from exc
