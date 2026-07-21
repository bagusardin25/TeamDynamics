from __future__ import annotations

import csv
import pytest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from models.document import DocumentAnalysisError
from routers import document as document_router


def create_client() -> TestClient:
    app = FastAPI()
    app.include_router(document_router.router)
    return TestClient(app)


def test_document_route_returns_valid_analysis(monkeypatch):
    async def fake_extract(content, filename):
        return "Northstar Labs launch brief"

    async def fake_analyze(text, filename):
        return {"company_name": "Northstar Labs", "team_source": "none"}

    monkeypatch.setattr(document_router, "extract_text_from_file", fake_extract)
    monkeypatch.setattr(document_router, "analyze_document", fake_analyze)

    response = create_client().post(
        "/api/document/analyze",
        files={"file": ("brief.txt", b"launch brief", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json()["analysis"]["company_name"] == "Northstar Labs"


def test_document_route_rejects_legacy_doc_files():
    response = create_client().post(
        "/api/document/analyze",
        files={"file": ("brief.doc", b"legacy", "application/msword")},
    )

    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_document_route_keeps_non_extractable_text_as_a_400(monkeypatch):
    async def empty_extract(content, filename):
        return ""

    monkeypatch.setattr(document_router, "extract_text_from_file", empty_extract)

    response = create_client().post(
        "/api/document/analyze",
        files={"file": ("scan.pdf", b"pdf", "application/pdf")},
    )

    assert response.status_code == 400
    assert "Could not extract any text" in response.json()["detail"]


def test_document_route_returns_502_when_ai_analysis_fails(monkeypatch):
    async def fake_extract(content, filename):
        return "usable text"

    async def failing_analyze(text, filename):
        raise DocumentAnalysisError("AI could not analyze this document.")

    monkeypatch.setattr(document_router, "extract_text_from_file", fake_extract)
    monkeypatch.setattr(document_router, "analyze_document", failing_analyze)

    response = create_client().post(
        "/api/document/analyze",
        files={"file": ("brief.txt", b"usable text", "text/plain")},
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "AI could not analyze this document."


def test_document_route_rejects_legacy_xls_files():
    response = create_client().post(
        "/api/document/analyze",
        files={"file": ("brief.xls", b"legacy", "application/vnd.ms-excel")},
    )

    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_document_route_rejects_oversized_files():
    response = create_client().post(
        "/api/document/analyze",
        files={
            "file": (
                "large.txt",
                b"x" * (document_router.MAX_FILE_SIZE + 1),
                "text/plain",
            )
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "File too large. Maximum size is 10MB."


@pytest.mark.parametrize(
    ("filename", "expected_detail"),
    [
        ("broken.pdf", "Could not extract text from PDF file."),
        ("broken.docx", "Could not extract text from DOCX file."),
        ("broken.xlsx", "Could not extract text from XLSX file."),
    ],
)
@pytest.mark.filterwarnings(
    r"ignore:^PyPDF2 is deprecated\. Please move to the pypdf library instead\.$:"
    r"DeprecationWarning"
)
def test_document_route_sanitizes_malformed_supported_files(filename, expected_detail):
    response = create_client().post(
        "/api/document/analyze",
        files={"file": (filename, b"not a valid document", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == expected_detail


def test_document_route_sanitizes_csv_field_limit_errors():
    previous_limit = csv.field_size_limit(128)
    try:
        response = create_client().post(
            "/api/document/analyze",
            files={"file": ("wide.csv", b"a" * 129, "text/csv")},
        )
    finally:
        csv.field_size_limit(previous_limit)

    assert response.status_code == 400
    assert response.json()["detail"] == "Could not parse CSV file."


def test_document_route_accepts_file_at_max_size(monkeypatch):
    captured = {}

    async def fake_extract(content, filename):
        captured["content_size"] = len(content)
        return "usable text"

    async def fake_analyze(text, filename):
        return {"company_name": "Northstar Labs", "team_source": "none"}

    monkeypatch.setattr(document_router, "extract_text_from_file", fake_extract)
    monkeypatch.setattr(document_router, "analyze_document", fake_analyze)

    response = create_client().post(
        "/api/document/analyze",
        files={
            "file": (
                "maximum.txt",
                b"x" * document_router.MAX_FILE_SIZE,
                "text/plain",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["file_size"] == document_router.MAX_FILE_SIZE
    assert captured["content_size"] == document_router.MAX_FILE_SIZE
