from __future__ import annotations

import asyncio
import copy

import csv
import pytest
from pydantic import ValidationError

from models.document import DocumentAnalysisError, DocumentAnalysisResult
from services import document_service, llm_service


def valid_analysis_payload() -> dict:
    return {
        "company_name": "Northstar Labs",
        "company_culture": "Candid, collaborative, and quality-focused.",
        "operating_context": "A SaaS team preparing a regulated launch under a fixed deadline.",
        "summary": "The launch brief defines ownership, risks, and operating constraints.",
        "key_requirements": ["Complete security review before launch."],
        "team_risks": ["The fixed deadline may encourage unsafe shortcuts."],
        "suggested_crisis": {
            "title": "Security approval blocked",
            "description": "A critical audit finding blocks launch with 48 hours remaining.",
        },
        "team_source": "documented",
        "suggested_agents": [
            {
                "name": "Avery Chen",
                "source_evidence": "Avery Chen | Engineering Lead",
                "role": "Engineering Lead",
                "type": "Direct and methodical",
                "rationale": "The brief names Avery as engineering owner.",
                "personality": {
                    "empathy": 55,
                    "ambition": 75,
                    "stressTolerance": 70,
                    "agreeableness": 45,
                    "assertiveness": 80,
                },
            }
        ],
        "suggested_team_rules": ["Escalate release blockers immediately."],
        "actionable_insights": ["Rehearse the audit escalation path."],
    }


def test_document_analysis_accepts_a_documented_roster():
    result = DocumentAnalysisResult.model_validate(valid_analysis_payload())

    assert result.team_source == "documented"
    assert result.suggested_agents[0].name == "Avery Chen"
    assert result.suggested_agents[0].personality.stressTolerance == 70


def test_document_analysis_requires_evidence_for_documented_team():
    payload = valid_analysis_payload()
    payload["suggested_agents"][0]["source_evidence"] = None

    with pytest.raises(ValidationError, match="require non-empty source_evidence"):
        DocumentAnalysisResult.model_validate(payload)


def test_document_analysis_requires_null_evidence_for_inferred_team():
    payload = valid_analysis_payload()
    payload["team_source"] = "inferred"

    with pytest.raises(ValidationError, match="source_evidence=null"):
        DocumentAnalysisResult.model_validate(payload)

    payload["suggested_agents"][0]["source_evidence"] = None
    result = DocumentAnalysisResult.model_validate(payload)

    assert result.suggested_agents[0].source_evidence is None


def test_document_analysis_rejects_agents_when_team_source_is_none():
    payload = valid_analysis_payload()
    payload["team_source"] = "none"

    with pytest.raises(ValidationError, match="empty when team_source is none"):
        DocumentAnalysisResult.model_validate(payload)


def test_document_analysis_requires_agents_for_a_documented_team():
    payload = valid_analysis_payload()
    payload["suggested_agents"] = []

    with pytest.raises(ValidationError, match="requires at least one team member"):
        DocumentAnalysisResult.model_validate(payload)


def test_document_analysis_rejects_out_of_range_personality_values():
    payload = valid_analysis_payload()
    payload["suggested_agents"][0]["personality"]["assertiveness"] = 101

    with pytest.raises(ValidationError):
        DocumentAnalysisResult.model_validate(payload)


def test_analyze_document_uses_the_document_contract(monkeypatch):
    captured = {}

    async def fake_dispatch(*args, **kwargs):
        captured.update(kwargs)
        captured["system_prompt"] = args[0]
        return valid_analysis_payload()

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Northstar Labs launch brief.\nAvery Chen | Engineering Lead",
            "launch.txt",
        )
    )

    assert captured["response_model"] is DocumentAnalysisResult
    assert captured["allow_model_fallback"] is False
    assert "return every explicitly listed person, up to 8 team members" in captured["system_prompt"]
    assert 'For team_source="inferred", suggest 2-4 relevant roles' in captured["system_prompt"]
    assert 'when team_source is "none", return suggested_agents=[]' in captured["system_prompt"]
    assert 'return "Avery Chen", not "Avery"' in captured["system_prompt"]
    assert "source_evidence must be copied verbatim" in captured["system_prompt"]
    assert "A realistic first name" not in captured["system_prompt"]
    assert result["operating_context"].startswith("A SaaS team")
    assert result["team_source"] == "documented"


def test_analyze_document_retries_invalid_roster_evidence_once(monkeypatch):
    initial = valid_analysis_payload()
    initial["suggested_agents"][0]["source_evidence"] = (
        "Avery | Engineering Lead"
    )
    corrected = valid_analysis_payload()
    corrected["company_name"] = "Drifted Retry Company"
    corrected["suggested_crisis"]["title"] = "Drifted retry crisis"
    calls = []

    async def fake_dispatch(*args, **kwargs):
        calls.append((args, kwargs))
        return initial if len(calls) == 1 else corrected

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery Chen | Engineering Lead",
            "team.txt",
        )
    )

    assert len(calls) == 2
    assert "CORRECTIVE RETRY" in calls[1][0][1]
    assert all(call[1]["allow_model_fallback"] is False for call in calls)
    assert [agent["name"] for agent in result["suggested_agents"]] == [
        "Avery Chen"
    ]
    assert result["company_name"] == "Northstar Labs"
    assert result["suggested_crisis"]["title"] == "Security approval blocked"
    assert "source_evidence" not in result["suggested_agents"][0]


def test_analyze_document_completes_all_explicit_roster_rows_when_ai_returns_four(
    monkeypatch,
):
    documented_roster = [
        ("Maya Pratama", "CEO", "Visioner dan cepat"),
        ("Arif Nugroho", "CTO", "Analitis dan tenang"),
        ("Nadia Putri", "COO", "Praktis dan tegas"),
        ("Raka Wijaya", "Head of Engineering", "Detail dan terbuka"),
        ("Sinta Maheswari", "Head of Security", "Skeptis dan hati-hati"),
        (
            "Dimas Kurniawan",
            "Head of Customer Success",
            "Empatik dan membela pelanggan",
        ),
        ("Laras Ayuningtyas", "Finance Director", "Konservatif"),
        ("Bima Santoso", "People & Culture Lead", "Suportif"),
    ]
    document_text = "\n".join(
        ["Nama | Peran | Karakter | Fokus utama"]
        + [
            f"{name} | {role} | {character} | Fokus"
            for name, role, character in documented_roster
        ]
    )
    partial = valid_analysis_payload()
    agent_template = partial["suggested_agents"][0]
    partial["suggested_agents"] = [
        {
            **copy.deepcopy(agent_template),
            "name": name,
            "role": role,
            "source_evidence": f"{name} | {role}",
            "type": character,
        }
        for name, role, character in documented_roster[:4]
    ]
    calls = []

    async def fake_dispatch(*args, **kwargs):
        calls.append((args, kwargs))
        return copy.deepcopy(partial)

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(document_text, "team.pdf")
    )

    assert len(calls) == 2
    assert "Bima Santoso | People & Culture Lead" in calls[1][0][1]
    assert result["team_source"] == "documented"
    assert [agent["name"] for agent in result["suggested_agents"]] == [
        name for name, _, _ in documented_roster
    ]
    assert [agent["role"] for agent in result["suggested_agents"]] == [
        role for _, role, _ in documented_roster
    ]
    assert all(
        "source_evidence" not in agent
        for agent in result["suggested_agents"]
    )


def test_explicit_roster_parser_stops_before_later_risk_table():
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
RISK REGISTER
Risk | Owner
API outage | Product Manager
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO")
    ]


def test_explicit_roster_parser_stops_at_generic_section_boundary():
    document_text = """Nama | Peran
Maya Pratama | CEO
MILESTONES
Workstream | Lead
Platform | Engineering Lead
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO")
    ]


def test_explicit_roster_parser_stops_at_title_case_section_boundary():
    document_text = """Nama | Peran
Maya Pratama | CEO
Milestones
Workstream | Lead
Platform | Engineering Lead
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO")
    ]


def test_two_column_roster_stops_at_singular_title_case_section():
    document_text = """Nama | Peran
Maya Pratama | CEO
Roadmap
Workstream | Lead
Platform | Engineering Lead
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO")
    ]


def test_explicit_roster_parser_stops_after_empty_roster_section():
    document_text = """Nama | Peran
Milestones
Workstream | Lead
Platform | Engineering Lead
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert roster == []


def test_explicit_roster_parser_keeps_title_case_wrapped_context():
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
Customer Focus
Arif Nugroho | CTO | Analitis
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO"),
        ("Arif Nugroho", "CTO"),
    ]


def test_explicit_roster_parser_keeps_one_word_name_after_wrapped_context():
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
Customer Focus
Budi | Engineering Lead | Teliti
Arif Nugroho | CTO | Analitis
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [(row.name, row.role) for row in roster] == [
        ("Maya Pratama", "CEO"),
        ("Budi", "Engineering Lead"),
        ("Arif Nugroho", "CTO"),
    ]



def test_explicit_roster_parser_rejects_status_fragment_without_using_roster_slot():
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
Arif Nugroho | CTO | Analitis
Nadia Putri | Product Manager | Kolaboratif
Raka Wijaya | Engineering Lead | Tegas
kelelahan. | engineer, dan timeline | status proyek
Sinta Maheswari | UX Researcher | Empatik
Dimas Kurniawan | Backend Engineer | Pragmatis
Laras Ayuningtyas | Customer Success Lead | Diplomatis
Bima Santoso | People & Culture Lead | Suportif
"""

    roster = document_service._extract_explicit_documented_roster(document_text)

    assert [row.name for row in roster] == [
        "Maya Pratama",
        "Arif Nugroho",
        "Nadia Putri",
        "Raka Wijaya",
        "Sinta Maheswari",
        "Dimas Kurniawan",
        "Laras Ayuningtyas",
        "Bima Santoso",
    ]

def test_analyze_document_drops_agents_not_in_explicit_roster(monkeypatch):
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
Arif Nugroho | CTO | Analitis

Project sponsor Jordan Lee serves as Product Manager.
"""
    payload = valid_analysis_payload()
    agent_template = payload["suggested_agents"][0]
    payload["suggested_agents"] = [
        {
            **copy.deepcopy(agent_template),
            "name": "Maya Pratama",
            "role": "CEO",
            "source_evidence": "Maya Pratama | CEO",
        },
        {
            **copy.deepcopy(agent_template),
            "name": "Arif Nugroho",
            "role": "CTO",
            "source_evidence": "Arif Nugroho | CTO",
        },
        {
            **copy.deepcopy(agent_template),
            "name": "Jordan Lee",
            "role": "Product Manager",
            "source_evidence": "Project sponsor Jordan Lee serves as Product Manager.",
        },
    ]
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return copy.deepcopy(payload)

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(document_text, "team.pdf")
    )

    assert calls == 2
    assert [
        (agent["name"], agent["role"])
        for agent in result["suggested_agents"]
    ] == [
        ("Maya Pratama", "CEO"),
        ("Arif Nugroho", "CTO"),
    ]


def test_analyze_document_requires_documented_source_for_explicit_roster(
    monkeypatch,
):
    document_text = """Nama | Peran | Karakter
Maya Pratama | CEO | Visioner
"""
    inferred = valid_analysis_payload()
    inferred["team_source"] = "inferred"
    inferred["suggested_agents"][0]["name"] = "Maya Pratama"
    inferred["suggested_agents"][0]["role"] = "CEO"
    inferred["suggested_agents"][0]["source_evidence"] = None
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return copy.deepcopy(inferred)

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(document_text, "team.pdf")
    )

    assert calls == 2
    assert result["team_source"] == "documented"
    assert [
        (agent["name"], agent["role"])
        for agent in result["suggested_agents"]
    ] == [("Maya Pratama", "CEO")]


def test_analyze_document_downgrades_only_invalid_roster_after_retry(monkeypatch):
    invalid = valid_analysis_payload()
    invalid["suggested_agents"][0]["source_evidence"] = (
        "Avery | Engineering Lead"
    )
    corrected = valid_analysis_payload()
    corrected["company_name"] = "Drifted Retry Company"
    corrected["suggested_crisis"]["title"] = "Drifted retry crisis"
    corrected["team_source"] = "none"
    corrected["suggested_agents"] = []
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return invalid if calls == 1 else corrected

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery Chen | Engineering Lead",
            "team.txt",
        )
    )

    assert calls == 2
    assert result["company_name"] == "Northstar Labs"
    assert result["company_culture"].startswith("Candid")
    assert result["operating_context"].startswith("A SaaS team")
    assert result["suggested_crisis"]["title"] == "Security approval blocked"
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []
    assert any(
        "roster" in insight.casefold()
        for insight in result["actionable_insights"]
    )


def test_analyze_document_retry_provider_failure_is_not_downgraded(monkeypatch):
    invalid = valid_analysis_payload()
    invalid["suggested_agents"][0]["source_evidence"] = (
        "Avery | Engineering Lead"
    )
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        if calls == 1:
            return invalid
        raise RuntimeError("provider unavailable during corrective retry")

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    with pytest.raises(DocumentAnalysisError, match="could not analyze"):
        asyncio.run(
            document_service.analyze_document(
                "Avery Chen | Engineering Lead",
                "team.txt",
            )
        )

    assert calls == 2


def test_analyze_document_matches_pdf_whitespace_without_retry(monkeypatch):
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return valid_analysis_payload()

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery   Chen\n|\tEngineering Lead",
            "team.pdf",
        )
    )

    assert calls == 1
    assert result["team_source"] == "documented"
    assert result["suggested_agents"][0]["name"] == "Avery Chen"


def test_analyze_document_grounds_pdf_table_name_and_role_without_exact_quote(
    monkeypatch,
):
    payload = valid_analysis_payload()
    payload["suggested_agents"][0]["source_evidence"] = (
        "Avery Chen serves as Engineering Lead"
    )
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Team roster\nAvery Chen | Engineering Lead",
            "team.pdf",
        )
    )

    assert calls == 1


def test_analyze_document_rejects_distant_pdf_name_role_grounding(
    monkeypatch,
):
    payload = valid_analysis_payload()
    payload["suggested_agents"][0]["source_evidence"] = (
        "Avery Chen serves as Engineering Lead"
    )
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery Chen " + "unrelated context " * 30 + "Engineering Lead",
            "team.pdf",
        )
    )

    assert calls == 2
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


def test_analyze_document_rejects_swapped_roles_across_pdf_rows(monkeypatch):
    payload = valid_analysis_payload()
    payload["suggested_agents"] = [
        {
            **payload["suggested_agents"][0],
            "role": "Engineering Lead",
            "source_evidence": "Avery Chen serves as Engineering Lead",
        },
        {
            **payload["suggested_agents"][0],
            "name": "Morgan Lee",
            "role": "Product Manager",
            "source_evidence": "Morgan Lee serves as Product Manager",
        },
    ]
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery Chen | Product Manager\nMorgan Lee | Engineering Lead",
            "team.pdf",
        )
    )

    assert calls == 2
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


def test_analyze_document_grounds_each_agent_to_its_own_pdf_row(monkeypatch):
    payload = valid_analysis_payload()
    payload["suggested_agents"] = [
        {
            **payload["suggested_agents"][0],
            "name": "Avery Chen",
            "role": "Engineering Lead",
            "source_evidence": "Avery Chen serves as Engineering Lead",
        },
        {
            **payload["suggested_agents"][0],
            "name": "Morgan Lee",
            "role": "Product Manager",
            "source_evidence": "Morgan Lee serves as Product Manager",
        },
    ]
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Avery Chen | Engineering Lead\nMorgan Lee | Product Manager",
            "team.pdf",
        )
    )

    assert calls == 1
    assert result["team_source"] == "documented"
    assert [agent["name"] for agent in result["suggested_agents"]] == [
        "Avery Chen",
        "Morgan Lee",
    ]


def test_analyze_document_accepts_complete_role_before_pdf_persona_column(
    monkeypatch,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Maya Pratama"
    agent["role"] = "CEO"
    agent["source_evidence"] = (
        "Nama Peran Karakter Fokus utama: Maya Pratama CEO "
        "Visioner dan cepat mengambil keputusan."
    )
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Nama Peran Karakter Fokus utama\n"
            "Maya Pratama CEO Visioner dan cepat mengambil keputusan.",
            "team.pdf",
        )
    )

    assert calls == 1
    assert result["team_source"] == "documented"
    assert result["suggested_agents"][0]["role"] == "CEO"


def test_analyze_document_rejects_partial_role_from_pdf_table_row(monkeypatch):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Raka Wijaya"
    agent["role"] = "Head"
    agent["source_evidence"] = "Raka Wijaya serves as Head"
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Raka Wijaya Head of Engineering Detail dan terbuka.",
            "team.pdf",
        )
    )

    assert calls == 2
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


def test_analyze_document_rejects_partial_open_ended_role_in_pdf_column(
    monkeypatch,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Raka Wijaya"
    agent["role"] = "Head"
    agent["source_evidence"] = "Raka Wijaya serves as Head"
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Raka Wijaya | Head Legal | Detail dan terbuka.",
            "team.pdf",
        )
    )

    assert calls == 2
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


def test_analyze_document_accepts_complete_role_before_pdf_persona_column(
    monkeypatch,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Raka Wijaya"
    agent["role"] = "Head of Engineering"
    agent["source_evidence"] = (
        "Raka Wijaya serves as Head of Engineering"
    )
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Raka Wijaya | Head of Engineering | Customer-focused and calm.",
            "team.pdf",
        )
    )

    assert calls == 1
    assert result["team_source"] == "documented"
    assert result["suggested_agents"][0]["role"] == "Head of Engineering"


def test_pdf_layout_rows_preserve_column_boundaries():
    fragments = [
        (303.0, 653.6, "Detail dan terbuka."),
        (51.1, 653.6, "Raka Wijaya"),
        (180.7, 653.6, "Head of Engineering"),
        (51.1, 609.1, "Sinta Maheswari"),
        (180.7, 609.1, "Head of Security"),
    ]

    assert document_service._pdf_layout_rows(fragments) == [
        "Raka Wijaya | Head of Engineering | Detail dan terbuka.",
        "Sinta Maheswari | Head of Security",
    ]


def test_pdf_layout_merges_split_name_and_role_fragments_before_grounding(
    monkeypatch,
):
    rows = document_service._pdf_layout_rows(
        [
            (51.1, 653.6, "Raka", 8.5),
            (75.0, 653.6, "Wijaya", 8.5),
            (180.7, 653.6, "Head", 8.5),
            (215.0, 653.6, "Legal", 8.5),
            (303.0, 653.6, "Detail dan terbuka.", 8.5),
        ]
    )
    assert rows == ["Raka Wijaya | Head Legal | Detail dan terbuka."]

    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Raka Wijaya"
    agent["role"] = "Head"
    agent["source_evidence"] = "Raka Wijaya serves as Head"
    calls = 0

    async def fake_dispatch(*args, **kwargs):
        nonlocal calls
        calls += 1
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document("\n".join(rows), "team.pdf")
    )

    assert calls == 2
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []

def test_analyze_document_preserves_names_from_unique_verbatim_evidence(monkeypatch):
    payload = valid_analysis_payload()
    payload["suggested_agents"] = [
        {
            **payload["suggested_agents"][0],
            "name": "Avery Chen",
            "role": "Engineering Lead",
            "source_evidence": "Avery Chen | Engineering Lead",
        },
        {
            **payload["suggested_agents"][0],
            "name": "Morgan Lee",
            "role": "Product Manager",
            "source_evidence": "Morgan Lee | Product Manager",
        },
        {
            **payload["suggested_agents"][0],
            "name": "Riley Shah",
            "role": "Security Lead",
            "source_evidence": "Riley Shah | Security Lead",
        },
    ]

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            """Northstar Labs team roster:
Avery Chen | Engineering Lead
Morgan Lee | Product Manager
Riley Shah | Security Lead""",
            "team.txt",
        )
    )

    assert [agent["name"] for agent in result["suggested_agents"]] == [
        "Avery Chen",
        "Morgan Lee",
        "Riley Shah",
    ]
    assert all(
        "source_evidence" not in agent
        for agent in result["suggested_agents"]
    )


def test_analyze_document_accepts_particle_name_in_verbatim_evidence(monkeypatch):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Maria de la Cruz"
    agent["role"] = "Director of Operations"
    agent["source_evidence"] = (
        "Maria de la Cruz serves as Director of Operations"
    )

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Maria de la Cruz serves as Director of Operations.",
            "team.txt",
        )
    )

    assert result["suggested_agents"][0]["name"] == "Maria de la Cruz"


def test_analyze_document_accepts_indonesian_one_word_name(monkeypatch):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = "Budi"
    agent["role"] = "Engineering Lead"
    agent["source_evidence"] = "Budi adalah Engineering Lead"

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(
            "Budi adalah Engineering Lead.",
            "team.txt",
        )
    )

    assert result["suggested_agents"][0]["name"] == "Budi"


@pytest.mark.parametrize(
    "source_evidence",
    [
        "Avery Chen is the Engineering Lead at Northstar",
        "Avery Chen (Engineering Lead)",
        "Engineering Lead: Avery Chen",
    ],
)
def test_analyze_document_accepts_common_verbatim_evidence_formats(
    monkeypatch,
    source_evidence,
):
    payload = valid_analysis_payload()
    payload["suggested_agents"][0]["source_evidence"] = source_evidence

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(source_evidence, "team.txt")
    )

    assert result["suggested_agents"][0]["name"] == "Avery Chen"


@pytest.mark.parametrize("role", ["UX Designer", "QA", "Recruiter"])
def test_analyze_document_accepts_roles_without_static_indicator(
    monkeypatch,
    role,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["role"] = role
    agent["source_evidence"] = f"Avery Chen | {role}"

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(agent["source_evidence"], "team.txt")
    )

    assert result["suggested_agents"][0]["role"] == role


@pytest.mark.parametrize(
    ("documented_name", "source_evidence"),
    [
        ("Senior Software", "Senior Software | Engineering Lead"),
        ("Product Team", "Product Team | Engineering Lead"),
        ("Northstar Labs", "Northstar Labs | Engineering Lead"),
        ("avery", "avery chen | Engineering Lead"),
        ("Juan", "Juan y Perez | Engineering Lead"),
    ],
)
def test_analyze_document_downgrades_labels_and_locale_neutral_truncation(
    monkeypatch,
    documented_name,
    source_evidence,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = documented_name
    agent["source_evidence"] = source_evidence

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(source_evidence, "team.txt")
    )

    assert result["company_name"] == "Northstar Labs"
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


@pytest.mark.parametrize(
    ("document_text", "returned_name", "returned_role", "source_evidence"),
    [
        (
            "Avery Chen Owns Engineering Lead",
            "Avery Chen",
            "Engineering Lead",
            "Avery Chen Owns Engineering Lead",
        ),
        (
            "Avery Chen Engineering Manager",
            "Avery Chen",
            "Engineering",
            "Avery Chen Engineering Manager",
        ),
        (
            "Avery Chen | Engineering Lead\nAvery Chen | Engineering Lead",
            "Avery Chen",
            "Engineering Lead",
            "Avery Chen | Engineering Lead",
        ),
        (
            "Avery Chen | Engineering Lead",
            "Avery",
            "Engineering Lead",
            "Avery Chen | Engineering Lead",
        ),
        (
            "Northstar Labs launch brief",
            "Northstar Labs",
            "launch brief",
            "Northstar Labs launch brief",
        ),
        (
            "Engineering Lead",
            "Engineering",
            "Lead",
            "Engineering Lead",
        ),
        (
            "Avery Chen-Smith is the Engineering Lead",
            "Avery Chen",
            "Engineering Lead",
            "Avery Chen-Smith is the Engineering Lead",
        ),
    ],
)
def test_analyze_document_downgrades_unverifiable_documented_evidence(
    monkeypatch,
    document_text,
    returned_name,
    returned_role,
    source_evidence,
):
    payload = valid_analysis_payload()
    agent = payload["suggested_agents"][0]
    agent["name"] = returned_name
    agent["role"] = returned_role
    agent["source_evidence"] = source_evidence

    async def fake_dispatch(*args, **kwargs):
        return payload

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", fake_dispatch)

    result = asyncio.run(
        document_service.analyze_document(document_text, "team.txt")
    )

    assert result["company_name"] == "Northstar Labs"
    assert result["team_source"] == "none"
    assert result["suggested_agents"] == []


def test_analyze_document_raises_instead_of_returning_fake_success(monkeypatch):
    async def failing_dispatch(*args, **kwargs):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(llm_service, "_dispatch_llm_call", failing_dispatch)

    with pytest.raises(DocumentAnalysisError, match="could not analyze"):
        asyncio.run(document_service.analyze_document("usable text", "brief.txt"))


@pytest.mark.parametrize(
    ("filename", "expected_message"),
    [
        ("invalid.txt", "Could not decode TXT file as UTF-8."),
        ("invalid.csv", "Could not decode CSV file as UTF-8."),
    ],
)
def test_extract_text_rejects_invalid_utf8(filename, expected_message):
    with pytest.raises(ValueError) as exc_info:
        asyncio.run(document_service.extract_text_from_file(b"\xff\xfe\xfa", filename))

    assert exc_info.type.__name__ == "DocumentExtractionError"
    assert str(exc_info.value) == expected_message


@pytest.mark.parametrize(
    ("filename", "expected_message"),
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
def test_extract_text_sanitizes_malformed_supported_files(filename, expected_message):
    with pytest.raises(ValueError) as exc_info:
        asyncio.run(
            document_service.extract_text_from_file(b"not a valid document", filename)
        )

    assert exc_info.type.__name__ == "DocumentExtractionError"
    assert str(exc_info.value) == expected_message


def test_extract_text_sanitizes_csv_field_limit_errors():
    previous_limit = csv.field_size_limit(128)
    try:
        with pytest.raises(ValueError) as exc_info:
            asyncio.run(
                document_service.extract_text_from_file(b"a" * 129, "wide.csv")
            )
    finally:
        csv.field_size_limit(previous_limit)

    assert exc_info.type.__name__ == "DocumentExtractionError"
    assert str(exc_info.value) == "Could not parse CSV file."
