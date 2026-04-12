"""
LLM Service — supports OpenAI, Google Gemini, and OpenRouter.
Generates agent responses and report insights using structured JSON output.
Supports per-agent model override via the agent's `model` field.
"""

from __future__ import annotations

import json
import os
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()

# ── Provider / Model resolution ───────────────────────────────────────

def _resolve_provider_and_model(agent_model: str | None) -> tuple[str, str | None]:
    """
    Determine which provider+model to use for a given agent.

    Logic:
    1. If agent has a model override → detect provider from the model string.
    2. Otherwise → fall back to global LLM_PROVIDER + its default model.

    Returns (provider, model) where model may be None (= use env default).
    """
    if agent_model:
        # OpenRouter models always contain "/" (e.g. "anthropic/claude-3.5-sonnet")
        if "/" in agent_model:
            return "openrouter", agent_model
        # Direct OpenAI model names
        if agent_model.startswith(("gpt-", "o1", "o3", "chatgpt")):
            return "openai", agent_model
        # Direct Gemini model names
        if agent_model.startswith("gemini"):
            return "gemini", agent_model
        # Default: treat unknown as OpenRouter (most likely)
        return "openrouter", agent_model

    return LLM_PROVIDER, None


def _compute_temperature(agent: dict) -> float:
    """
    Compute agent-specific temperature based on personality traits.
    High empathy / low assertiveness → more creative (higher temp)
    Low empathy / high assertiveness → more precise (lower temp)
    """
    personality = agent.get("personality", {})
    empathy = personality.get("empathy", 50)
    assertiveness = personality.get("assertiveness", 50)
    agreeableness = personality.get("agreeableness", 50)

    # Base temperature 0.8, range 0.5 - 1.1
    creativity_score = (empathy + agreeableness - assertiveness) / 300  # 0 to ~0.66
    temperature = 0.5 + creativity_score * 0.9  # 0.5 to ~1.1
    return round(min(max(temperature, 0.5), 1.1), 2)


def _build_agent_system_prompt(agent: dict, company: dict, crisis: str) -> str:
    """Build the system prompt for an agent."""
    personality = agent.get("personality", {})
    state = agent.get("state", {})
    motivation = agent.get("motivation", "")
    expertise = agent.get("expertise", "")

    # Build optional sections
    motivation_section = f"\nYOUR MOTIVATION: {motivation}" if motivation else ""
    expertise_section = f"\nYOUR EXPERTISE/SKILLS: {expertise}" if expertise else ""

    return f"""You are roleplaying as {agent['name']}, a {agent['role']} at {company['name']}.

COMPANY CONTEXT: {company['culture']}

YOUR PERSONALITY PROFILE:
- Type: {agent.get('type', 'Unknown')}
- Empathy: {personality.get('empathy', 50)}/100
- Ambition: {personality.get('ambition', 50)}/100
- Stress Tolerance: {personality.get('stressTolerance', personality.get('stress_tolerance', 50))}/100
- Agreeableness: {personality.get('agreeableness', 50)}/100
- Assertiveness: {personality.get('assertiveness', 50)}/100
{motivation_section}{expertise_section}

YOUR CURRENT STATE:
- Morale: {state.get('morale', 70)}%
- Stress: {state.get('stress', 30)}%
- Loyalty: {state.get('loyalty', 70)}%
- Productivity: {state.get('productivity', 75)}%

CRISIS: {crisis}

RULES:
1. Stay deeply in character based on your personality profile. Your personality numbers DIRECTLY shape how you write.
2. Your public message is what you'd say in the team Slack channel — keep it natural and conversational.
3. Your internal thought reveals what you're truly thinking but NOT saying out loud.
4. PERSONALITY EFFECTS ON COMMUNICATION STYLE:
   - Low empathy (<30) + high assertiveness (>70) → blunt, confrontational, dismissive of emotions
   - High empathy (>70) → caring, asks about others' wellbeing, supportive
   - High agreeableness (>70) → sugarcoating, avoids direct conflict, agrees easily
   - Low agreeableness (<30) → contrarian, challenges ideas, skeptical
   - High ambition (>70) → sees crisis as opportunity, competitive, driven
   - Low stress tolerance (<30) + high current stress (>60) → emotional outbursts, panicking, catastrophizing
5. If morale is below 25, you are deeply unhappy and seriously considering quitting.
6. If stress is above 85, you are near breaking point — show it in your words.
7. If management sends an intervention or announcement, react to it based on your personality. Cynical people doubt it, grateful people appreciate it.
8. Be realistic and human — show vulnerability, frustration, humor, sarcasm, or resignation as appropriate.
9. Reference your expertise/skills when relevant to the discussion.
10. NEVER break character. Do NOT sound like an AI or use corporate jargon unless your role demands it.

Respond ONLY with valid JSON in this exact format:
{{
  "public_message": "What you say publicly in Slack (1-3 sentences, conversational tone)",
  "internal_thought": "What you're truly thinking but not saying (1-2 sentences)",
  "state_changes": {{
    "morale": <integer between -30 and 10>,
    "stress": <integer between -10 and 30>,
    "loyalty": <integer between -15 and 5>,
    "productivity": <integer between -20 and 10>
  }}
}}"""


def _build_round_user_prompt(round_num: int, total_rounds: int,
                             conversation_history: list[dict],
                             intervention: str | None = None) -> str:
    """Build the user prompt for a round."""
    history_text = ""
    for msg in conversation_history[-10:]:  # Last 10 msgs for context
        if msg.get("type") == "system":
            history_text += f"[SYSTEM] {msg['content']}\n"
        elif msg.get("type") == "public":
            history_text += f"{msg.get('agent_name', 'Unknown')}: {msg['content']}\n"

    prompt = f"This is Week {round_num} of {total_rounds}.\n\n"
    if history_text:
        prompt += f"RECENT CONVERSATION:\n{history_text}\n"
    if intervention:
        prompt += f"\nNEW MANAGEMENT INTERVENTION: {intervention}\n"
    prompt += "\nRespond in character. Remember to output ONLY valid JSON."
    return prompt


# ── LLM Callers ───────────────────────────────────────────────────────

async def _call_openai(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9) -> dict:
    """Call OpenAI API."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    resolved_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    response = await client.chat.completions.create(
        model=resolved_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=500,
    )

    content = response.choices[0].message.content
    return json.loads(content)


async def _call_gemini(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9) -> dict:
    """Call Google Gemini API."""
    from google import genai

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    resolved_model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    response = await client.aio.models.generate_content(
        model=resolved_model,
        contents=f"{system_prompt}\n\n{user_prompt}",
        config={
            "response_mime_type": "application/json",
            "temperature": temperature,
            "max_output_tokens": 500,
        },
    )

    return json.loads(response.text)


async def _call_openrouter(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9) -> dict:
    """Call OpenRouter API (uses OpenAI-compatible SDK)."""
    from openai import AsyncOpenAI

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. Please add it to your .env file. "
            "Get a key at https://openrouter.ai/keys"
        )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        default_headers={
            "HTTP-Referer": os.getenv("FRONTEND_URL", "http://localhost:3000"),
            "X-Title": "TeamDynamics",
        },
    )

    resolved_model = model or os.getenv("OPENROUTER_DEFAULT_MODEL", "meta-llama/llama-3.1-8b-instruct:free")

    response = await client.chat.completions.create(
        model=resolved_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=500,
    )

    content = response.choices[0].message.content
    return json.loads(content)


# ── Dispatch helper ───────────────────────────────────────────────────

async def _dispatch_llm_call(
    system_prompt: str,
    user_prompt: str,
    provider: str,
    model: str | None = None,
    temperature: float = 0.9,
) -> dict:
    """Route a call to the correct LLM provider."""
    if provider == "gemini":
        return await _call_gemini(system_prompt, user_prompt, model, temperature)
    elif provider == "openrouter":
        return await _call_openrouter(system_prompt, user_prompt, model, temperature)
    else:
        return await _call_openai(system_prompt, user_prompt, model, temperature)


# ── Public API ────────────────────────────────────────────────────────

async def generate_agent_response(
    agent: dict,
    company: dict,
    crisis_description: str,
    round_num: int,
    total_rounds: int,
    conversation_history: list[dict],
    intervention: str | None = None,
) -> dict:
    """
    Generate an agent's response using the configured LLM provider.
    Supports per-agent model override via agent['model'].
    Returns dict with public_message, internal_thought, state_changes.
    """
    system_prompt = _build_agent_system_prompt(agent, company, crisis_description)
    user_prompt = _build_round_user_prompt(
        round_num, total_rounds, conversation_history, intervention
    )

    # Resolve per-agent provider/model
    agent_model = agent.get("model")
    provider, model = _resolve_provider_and_model(agent_model)
    temperature = _compute_temperature(agent)

    try:
        logger.info(
            f"Agent {agent['name']} → provider={provider}, model={model or 'default'}, temp={temperature}"
        )
        return await _dispatch_llm_call(system_prompt, user_prompt, provider, model, temperature)
    except Exception as e:
        logger.error(f"LLM call failed for {agent['name']} (provider={provider}): {e}")

        # Fallback: try global provider if per-agent failed
        if agent_model and provider != LLM_PROVIDER:
            try:
                logger.warning(f"Falling back to global provider '{LLM_PROVIDER}' for {agent['name']}")
                return await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER, None, temperature)
            except Exception as fallback_err:
                logger.error(f"Fallback also failed for {agent['name']}: {fallback_err}")

        # Final fallback response
        return {
            "public_message": f"*{agent['name']} stays silent, looking stressed.*",
            "internal_thought": "I can't even formulate my thoughts right now...",
            "state_changes": {"morale": -5, "stress": 5, "loyalty": -2, "productivity": -3},
        }


async def generate_report_insights(
    company: dict,
    crisis: str,
    agents_data: list[dict],
    messages: list[dict],
    total_rounds: int,
) -> dict:
    """
    Generate executive summary and recommendations for the post-sim report.
    Uses the global LLM provider.
    """
    agents_summary = ""
    for a in agents_data:
        state = a.get("state", {})
        agents_summary += (
            f"- {a['name']} ({a['role']}): "
            f"Morale {state.get('morale', '?')}%, "
            f"Stress {state.get('stress', '?')}%, "
            f"Resigned: {a.get('has_resigned', False)}"
        )
        if a.get("resigned_week"):
            agents_summary += f" (Week {a['resigned_week']})"
        agents_summary += "\n"

    # Sample of key messages
    key_msgs = [m for m in messages if m.get("type") in ("public", "system")][-15:]
    msgs_text = "\n".join(
        f"[W{m.get('round', '?')}] {m.get('agent_name', 'System')}: {m['content']}"
        for m in key_msgs
    )

    system_prompt = """You are an organizational psychologist AI analyzing a team simulation.
Generate a report based on the simulation data. Respond ONLY with valid JSON:
{
  "executive_summary": "2-3 sentence summary of what happened",
  "critical_finding": "The single most important finding (1-2 sentences)",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}"""

    user_prompt = f"""COMPANY: {company.get('name', 'Unknown')}
CULTURE: {company.get('culture', 'Unknown')}
CRISIS: {crisis}
DURATION: {total_rounds} weeks

AGENT FINAL STATES:
{agents_summary}

KEY CONVERSATION MOMENTS:
{msgs_text}

Analyze this simulation and generate insights."""

    try:
        return await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER)
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            "executive_summary": "The simulation completed but report generation encountered an error.",
            "critical_finding": "Unable to generate automated insights.",
            "recommendations": [
                "Review the simulation transcript manually.",
                "Check agent morale and stress trends.",
                "Consider intervention strategies for future scenarios.",
            ],
        }
