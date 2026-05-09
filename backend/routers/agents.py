"""
Agent preset routes and team template management.
"""

import json
import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from data.presets import PRESET_AGENTS
from routers.auth import require_auth, TokenData

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("/presets")
async def get_preset_agents():
    """Return all available preset agent personas."""
    return PRESET_AGENTS


# ── Team Templates ────────────────────────────────────────────────────

class SaveTemplateRequest(BaseModel):
    name: str
    agents: list[dict]


class RenameTemplateRequest(BaseModel):
    name: str


@router.post("/templates")
async def save_template(
    request: SaveTemplateRequest,
    current_user: TokenData = Depends(require_auth),
):
    """Save the current agent roster as a named template."""
    from models.database import save_team_template

    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Template name is required")
    if not request.agents or len(request.agents) == 0:
        raise HTTPException(status_code=400, detail="At least one agent is required")
    if len(request.agents) > 8:
        raise HTTPException(status_code=400, detail="Maximum 8 agents per template")

    template_id = f"tmpl-{uuid.uuid4().hex[:12]}"
    agents_json = json.dumps(request.agents)

    await save_team_template(
        template_id=template_id,
        user_id=current_user.user_id,
        name=request.name.strip(),
        agents_json=agents_json,
    )

    return {
        "id": template_id,
        "name": request.name.strip(),
        "agent_count": len(request.agents),
    }


@router.get("/templates")
async def list_templates(
    current_user: TokenData = Depends(require_auth),
):
    """List all templates for the current user."""
    from models.database import get_user_templates

    templates = await get_user_templates(current_user.user_id)

    # Parse agent count from agents_json length heuristic isn't great,
    # so we'll fetch properly. But for listing we stored json_length.
    # Let's return a clean list.
    result = []
    for t in templates:
        result.append({
            "id": t["id"],
            "name": t["name"],
            "created_at": str(t["created_at"]) if t.get("created_at") else None,
            "updated_at": str(t["updated_at"]) if t.get("updated_at") else None,
        })
    return result


@router.get("/templates/{template_id}")
async def get_template(
    template_id: str,
    current_user: TokenData = Depends(require_auth),
):
    """Get a full template including agent configurations."""
    from models.database import get_template_by_id

    template = await get_template_by_id(template_id, current_user.user_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    agents = json.loads(template["agents_json"])
    return {
        "id": template["id"],
        "name": template["name"],
        "agents": agents,
        "agent_count": len(agents),
        "created_at": str(template["created_at"]) if template.get("created_at") else None,
        "updated_at": str(template["updated_at"]) if template.get("updated_at") else None,
    }


@router.patch("/templates/{template_id}")
async def rename_template(
    template_id: str,
    request: RenameTemplateRequest,
    current_user: TokenData = Depends(require_auth),
):
    """Rename a template."""
    from models.database import update_template_name

    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    success = await update_template_name(template_id, current_user.user_id, request.name.strip())
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"id": template_id, "name": request.name.strip()}


@router.delete("/templates/{template_id}")
async def delete_template_endpoint(
    template_id: str,
    current_user: TokenData = Depends(require_auth),
):
    """Delete a template."""
    from models.database import delete_template

    success = await delete_template(template_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")

    return {"status": "deleted", "id": template_id}
