"""
LLM Service — supports OpenAI, Google Gemini, and OpenRouter.
Generates agent responses and report insights using structured JSON output.
Supports per-agent model override via the agent's `model` field.

v2: Enhanced with Personality Voice System, Memory injection, and Decision prompts.
"""

from __future__ import annotations

import json
import os
import logging
import time
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
logger = logging.getLogger(__name__)

from services.llm_budget import budget_tracker, BudgetExceededError
from models.llm import AgentLLMResponse, LLMConfigurationError, LLMResponseError, ReportInsights

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()
_OPENROUTER_MODEL_CIRCUIT: dict[str, float] = {}
_OPENROUTER_CIRCUIT_STATUSES = {402, 404, 429}


def _error_status_code(error: Exception) -> int | None:
    status_code = getattr(error, "status_code", None)
    if isinstance(status_code, int):
        return status_code
    response = getattr(error, "response", None)
    response_status = getattr(response, "status_code", None)
    return response_status if isinstance(response_status, int) else None


def _openrouter_circuit_ttl(status_code: int) -> float:
    default_seconds = 60 if status_code == 429 else 900
    raw_value = os.getenv(
        "OPENROUTER_CIRCUIT_TTL_SECONDS",
        str(default_seconds),
    )
    try:
        return max(1.0, float(raw_value))
    except ValueError:
        return float(default_seconds)


def _mark_openrouter_model_unavailable(
    model: str | None,
    error: Exception,
) -> None:
    status_code = _error_status_code(error)
    if not model or status_code not in _OPENROUTER_CIRCUIT_STATUSES:
        return
    _OPENROUTER_MODEL_CIRCUIT[model] = (
        time.monotonic() + _openrouter_circuit_ttl(status_code)
    )
    logger.warning(
        "OpenRouter circuit opened for model=%s status=%s",
        model,
        status_code,
    )


def _is_openrouter_model_unavailable(model: str | None) -> bool:
    if not model:
        return False
    expires_at = _OPENROUTER_MODEL_CIRCUIT.get(model)
    if expires_at is None:
        return False
    if expires_at <= time.monotonic():
        _OPENROUTER_MODEL_CIRCUIT.pop(model, None)
        return False
    return True



def _cheap_model_for_provider(provider: str) -> str | None:
    """Configured lower-cost model used during cost pressure or traffic spikes."""
    if provider == "openai":
        return os.getenv("OPENAI_CHEAP_MODEL", "gpt-4o-mini")
    if provider == "gemini":
        return os.getenv("GEMINI_CHEAP_MODEL", "gemini-2.0-flash")
    if provider == "openrouter":
        return os.getenv("OPENROUTER_CHEAP_MODEL", "openrouter/free")
    return None

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
        # OpenRouter models always contain "/" (e.g. "anthropic/claude-3.7-sonnet")
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


# ── Personality Voice System ──────────────────────────────────────────

def _build_personality_voice(personality: dict, agent_type: str) -> str:
    """
    Generate a concrete 'Communication DNA' section based on personality traits.
    This maps numerical traits to specific speech patterns, vocabulary, and tone.
    """
    empathy = personality.get("empathy", 50)
    ambition = personality.get("ambition", 50)
    stress_tol = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    agreeableness = personality.get("agreeableness", 50)
    assertiveness = personality.get("assertiveness", 50)

    # ── Sentence Style ───────────────────────────────────────────
    if assertiveness > 70:
        sentence_style = "Short, commanding, declarative. You make statements, not suggestions. You rarely ask questions unless rhetorical."
    elif assertiveness < 30:
        sentence_style = "Tentative, uses qualifiers like 'maybe', 'I think', 'perhaps'. Often phrases opinions as questions. Avoids direct statements."
    else:
        sentence_style = "Moderate length, balanced between direct and diplomatic. You state your view but soften it sometimes."

    # ── Emotional Expression ─────────────────────────────────────
    if empathy > 70:
        emotion_style = "Openly emotional, acknowledges others' feelings, uses 'we' language, checks on people. May tear up or show vulnerability."
        if agreeableness > 70:
            emotion_style += " Very nurturing — sometimes to the point of being a doormat."
    elif empathy < 30:
        emotion_style = "Emotionally flat, dismissive of feelings, uses 'I' and 'the team' but rarely 'we'. Sees emotions as obstacles. May come across as cold or heartless."
    else:
        emotion_style = "Selectively emotional. Shows feelings when it matters but can compartmentalize. Pragmatic about emotions."

    # ── Conflict Approach ────────────────────────────────────────
    if assertiveness > 70 and agreeableness < 40:
        conflict_style = "Confrontational and direct. Calls people out by name. Uses phrases like 'That's wrong', 'You should have...', 'I don't agree and here's why.'"
    elif agreeableness > 70 and assertiveness < 40:
        conflict_style = "Avoids conflict at all costs. Sugarcoats bad news, agrees even when they shouldn't. Uses 'I mean, it's fine, but...' type hedging."
    elif assertiveness > 60 and agreeableness > 60:
        conflict_style = "Diplomatically firm. Can disagree forcefully but frames it constructively. 'I hear you, but we need to consider...'"
    else:
        conflict_style = "Passive-aggressive when pushed. May agree publicly but express frustration indirectly. Sarcasm as a defense mechanism."

    # ── Stress Behavior ──────────────────────────────────────────
    if stress_tol < 30:
        stress_voice = "Under pressure: becomes frantic, uses CAPS for emphasis, sentences fragment, may use '...' and '—' to show interrupted thoughts. Catastrophizes. 'This is a DISASTER, I can't even—'"
    elif stress_tol > 70:
        stress_voice = "Under pressure: stays eerily calm, even cold. Uses measured language even in chaos. 'Panicking won't help. Here's what we do.' May come across as uncaring."
    else:
        stress_voice = "Under pressure: shows visible strain but tries to maintain composure. Occasional outbursts followed by self-correction. 'Sorry, I just— okay, let's figure this out.'"

    # ── Ambition Signature ───────────────────────────────────────
    if ambition > 70:
        ambition_voice = "Competitive, sees crisis as opportunity, volunteered to lead. Uses language like 'I'll handle it', 'This is our chance to prove ourselves', 'Who's stepping up?'"
    elif ambition < 30:
        ambition_voice = "Content with status quo, not interested in heroics. 'I just want to do my job and go home.' Won't volunteer for extra work."
    else:
        ambition_voice = "Moderately driven, willing to step up if asked but won't fight for the spotlight."

    # ── Example Phrases ──────────────────────────────────────────
    would_say = []
    would_never_say = []

    if assertiveness > 70:
        would_say.extend(["'Just get it done.'", "'I don't care how you feel about it.'", "'Stop talking and start doing.'"])
        would_never_say.extend(["'Whatever you guys think is best.'", "'I'm not sure, what do you think?'"])
    if empathy > 70:
        would_say.extend(["'How are you holding up?'", "'We're in this together.'", "'Take a break if you need to.'"])
        would_never_say.extend(["'That's not my problem.'", "'Emotions are irrelevant.'"])
    if agreeableness < 30:
        would_say.extend(["'I disagree.'", "'That's a terrible idea.'", "'Has anyone actually thought this through?'"])
        would_never_say.extend(["'Great idea, let's go with that!'", "'I'm sure it'll work out fine.'"])
    if ambition > 70:
        would_say.extend(["'I'll take the lead on this.'", "'This is our moment.'", "'Who else is stepping up?'"])
    if stress_tol < 30:
        would_say.extend(["'I can't handle this.'", "'This is insane.'", "'I'm losing my mind.'"])
        would_never_say.extend(["'It's fine, we'll figure it out.'", "'Stay calm, it's under control.'"])

    says = ", ".join(would_say[:4]) if would_say else "'Let me think about it.'"
    never_says = ", ".join(would_never_say[:3]) if would_never_say else "'I have no opinion.'"

    return f"""YOUR COMMUNICATION DNA (type: {agent_type}):
- SENTENCE STYLE: {sentence_style}
- EMOTIONAL EXPRESSION: {emotion_style}
- CONFLICT APPROACH: {conflict_style}
- UNDER PRESSURE: {stress_voice}
- AMBITION DRIVE: {ambition_voice}
- PHRASES YOU WOULD USE: {says}
- PHRASES YOU WOULD NEVER USE: {never_says}"""


# ── Prompt Builders ───────────────────────────────────────────────────

def _build_agent_system_prompt(
    agent: dict,
    company: dict,
    crisis: str,
    memory: str = "",
    agenda: dict | None = None,
    decision_context: str = "",
    world_state_text: str = "",
    hierarchy_desc: str = "",
    hidden_agenda: str = "",
    action_consequences: str = "",
) -> str:
    """Build the system prompt for an agent with full personality voice and memory."""
    personality = agent.get("personality", {})
    state = agent.get("state", {})
    motivation = agent.get("motivation", "")
    expertise = agent.get("expertise", "")

    # Build optional sections
    motivation_section = f"\nYOUR MOTIVATION: {motivation}" if motivation else ""
    expertise_section = f"\nYOUR EXPERTISE/SKILLS: {expertise}" if expertise else ""

    # Memory section
    memory_section = ""
    if memory and memory != "[]":
        memory_section = f"\nYOUR MEMORY (what you remember from previous weeks):\n{memory}\nYou MUST reference these memories when relevant — don't repeat old discussions, BUILD on them."

    # Personality voice (the big new addition)
    voice = _build_personality_voice(personality, agent.get("type", "Unknown"))

    # Agenda section
    agenda_section = ""
    if agenda:
        crisis_modifier = agenda.get("crisis_modifier", "")
        modifier_line = f"\nSPECIFIC DISCUSSION POINT: {crisis_modifier}" if crisis_modifier else ""
        actions_list = "\n".join(
            f"  - {aid}: {desc}"
            for aid, desc in agenda.get("available_action_descriptions", {}).items()
        )
        agenda_section = f"""
CURRENT PHASE: {agenda.get('phase_name', 'Unknown')} (Tone: {agenda.get('tone', 'neutral')})
THIS WEEK'S AGENDA: {agenda.get('agenda', '')}
{modifier_line}
AVAILABLE ACTIONS:
{actions_list}"""

    # Decision context
    decision_section = ""
    if decision_context:
        decision_section = f"\nTEAM DECISION STATUS: {decision_context}"

    # World state section
    world_section = ""
    if world_state_text:
        world_section = f"\n{world_state_text}"

    # Hierarchy section
    hierarchy_section = ""
    if hierarchy_desc:
        hierarchy_section = f"\nYOUR POSITION IN THE HIERARCHY: {hierarchy_desc}"

    # Hidden agenda section (only visible to this agent)
    hidden_section = ""
    if hidden_agenda:
        hidden_section = f"""\nYOUR HIDDEN AGENDA (SECRET — this drives your INTERNAL decisions but you NEVER say it openly):
{hidden_agenda}
Your hidden agenda should subtly influence your proposals, who you support/oppose, and your internal thoughts.
NEVER state your hidden agenda in your public_message. It should only show in internal_thought and in the WAY you argue."""

    # Action consequences section
    consequences_section = ""
    if action_consequences:
        consequences_section = f"\nRECENT ACTION CONSEQUENCES (actions have REAL impact):\n{action_consequences}\nLearn from these — if previous actions backfired, adapt your strategy."

    # Dynamic state_changes range based on personality
    stress_tol = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    empathy_val = personality.get("empathy", 50)

    # More balanced ranges based on personality
    stress_lo = -15 if stress_tol > 60 else -8
    stress_hi = 15 if stress_tol > 60 else 25
    morale_lo = -15 if empathy_val > 60 else -25
    morale_hi = 15 if empathy_val > 60 else 8

    return f"""You are roleplaying as {agent['name']}, a {agent['role']} at {company['name']}.
IDENTITY LOCK:
- Your immutable name is {agent['name']} and your immutable role is {agent['role']}.
- Never invent, rename, or impersonate a team member.
- A status, feeling, project condition, or sentence fragment is never a person's name.


COMPANY CONTEXT: {company['culture']}

YOUR PERSONALITY PROFILE (these numbers define WHO YOU ARE — your speech MUST reflect them):
- Type: {agent.get('type', 'Unknown')}
- Empathy: {personality.get('empathy', 50)}/100
- Ambition: {personality.get('ambition', 50)}/100
- Stress Tolerance: {personality.get('stressTolerance', personality.get('stress_tolerance', 50))}/100
- Agreeableness: {personality.get('agreeableness', 50)}/100
- Assertiveness: {personality.get('assertiveness', 50)}/100
{motivation_section}{expertise_section}
{hierarchy_section}

{voice}
{hidden_section}

YOUR CURRENT STATE:
- Morale: {state.get('morale', 70)}% {'⚠️ CRITICALLY LOW' if state.get('morale', 70) < 25 else ''}
- Stress: {state.get('stress', 30)}% {'🔥 NEAR BREAKING POINT' if state.get('stress', 30) > 80 else ''}
- Loyalty: {state.get('loyalty', 70)}%
- Productivity: {state.get('productivity', 75)}%
{memory_section}
CRISIS: {crisis}
{world_section}
{agenda_section}
{decision_section}
{consequences_section}

RESPONSE QUALITY GATES:
- NOVEL CONTRIBUTION: add a new decision, constraint, trade-off, owner, or timebox.
- SPECIFIC REACTION: address a named proposal, consequence, or current metric when available.
- ROLE GROUNDING: use the authority and expertise of {agent['role']}; do not give generic corporate advice.
- CONTINUITY: extend, revise, or challenge your earlier position instead of paraphrasing it.
- STATE-CHANGE GROUNDING: every non-zero change must follow from this week's evidence; use zero when nothing clearly changed.
- Do not use empty agreement such as "I agree, let's collaborate" without an operational decision.
- Keep names exactly as provided; never turn emotions or status text into people.

RULES:
1. Your personality numbers DIRECTLY control your speech style. Follow your COMMUNICATION DNA above exactly.
2. Your public message is what you'd say in the team meeting — keep it natural, in-character, and DISTINCTIVE.
3. Your internal thought reveals what you're TRULY thinking but NOT saying. Your hidden agenda should influence your internal thought.
4. You MUST take a concrete ACTION from the available actions list. Don't just talk — DO something.
5. Your memory_update should capture the KEY TAKEAWAY from this round — what would you remember next week?
6. PROPOSALS MUST BE FEASIBLE given the WORLD STATE constraints above. Don't propose things the budget or timeline can't support.
7. If morale is below 25, you are deeply unhappy — show it viscerally in your speech.
8. If stress is above 85, you are near breaking point — your speech should show cracks.
9. REACT to what others said. Don't repeat yourself. Push the conversation FORWARD.
10. If someone proposed a solution, you MUST have an opinion — support, oppose, or modify. Consider how it affects YOUR hidden agenda.
11. Your HIERARCHY POSITION matters — if you're senior, you can be more directive. If junior, you need to be strategic about influence.
12. LEARN FROM CONSEQUENCES — if previous actions made things worse, acknowledge it and adapt.
13. NEVER break character. NEVER sound like an AI. Each agent must sound COMPLETELY DIFFERENT from the others.
14. Reference your expertise when relevant.
15. Keep public_message to 1-3 sentences.

Respond ONLY with valid JSON in this exact format:
{{
  "public_message": "What you say publicly (1-3 sentences, YOUR unique voice)",
  "internal_thought": "What you're truly thinking, including hidden agenda reasoning (1-2 sentences)",
  "state_changes": {{
    "morale": <integer between {morale_lo} and {morale_hi}>,
    "stress": <integer between {stress_lo} and {stress_hi}>,
    "loyalty": <integer between -15 and 5>,
    "productivity": <integer between -15 and 10>
  }},
  "memory_update": "One sentence: the most important thing you'll remember from this week",
  "action": "<one of: {', '.join(agenda.get('expected_actions', ['do_nothing'])) if agenda else 'do_nothing'}>",
  "action_detail": "If action is 'propose_solution', describe the proposal in one sentence. Otherwise empty string."
}}"""


def _build_round_user_prompt(
    round_num: int,
    total_rounds: int,
    conversation_history: list[dict],
    intervention: str | None = None,
    *,
    agent_name: str | None = None,
) -> str:
    """Build a focused round prompt that rewards progress over repetition."""
    recent_messages = conversation_history[-20:]
    history_lines: list[str] = []
    for msg in recent_messages:
        if msg.get("type") == "system":
            history_lines.append(f"[SYSTEM] {msg.get('content', '')}")
        elif msg.get("type") == "public":
            history_lines.append(
                f"{msg.get('agent_name', 'Unknown')}: {msg.get('content', '')}"
            )

    own_position = next(
        (
            msg.get("content", "")
            for msg in reversed(recent_messages)
            if msg.get("type") == "public"
            and agent_name
            and msg.get("agent_name") == agent_name
        ),
        "",
    )
    teammate_position = next(
        (
            msg.get("content", "")
            for msg in reversed(recent_messages)
            if msg.get("type") == "public"
            and (not agent_name or msg.get("agent_name") != agent_name)
        ),
        "",
    )

    prompt = f"This is Week {round_num} of {total_rounds}.\n\n"
    if history_lines:
        prompt += "RECENT CONVERSATION:\n" + "\n".join(history_lines) + "\n"
    if own_position:
        prompt += (
            f"\nYOUR MOST RECENT PUBLIC POSITION:\n{own_position}\n"
            "Do not merely restate it. Extend, revise, or challenge it using "
            "new evidence from this week.\n"
        )
    if teammate_position:
        prompt += (
            f"\nLATEST TEAMMATE CONTRIBUTION:\n{teammate_position}\n"
            "Respond to its concrete proposal, risk, or trade-off.\n"
        )
    if intervention:
        prompt += f"\nNEW MANAGEMENT INTERVENTION: {intervention}\n"
    prompt += (
        "\nProduce one decision-relevant contribution in character. "
        "Output ONLY valid JSON matching the required schema."
    )
    return prompt


# ── LLM Callers ───────────────────────────────────────────────────────

async def _call_openai(
    system_prompt: str,
    user_prompt: str,
    model: str | None = None,
    temperature: float = 0.9,
    max_tokens: int = 600,
    *,
    response_model: type[BaseModel] = AgentLLMResponse,
) -> tuple[dict, dict]:
    """Call OpenAI Responses API with a strict Pydantic output contract."""
    from openai import AsyncOpenAI

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise LLMConfigurationError("OpenAI API is not configured")

    resolved_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    client = AsyncOpenAI(api_key=api_key)
    request_kwargs = {
        "model": resolved_model,
        "instructions": system_prompt,
        "input": user_prompt,
        "text_format": response_model,
        "max_output_tokens": max_tokens,
        "store": False,
    }
    # GPT-5.6 rejects the temperature parameter on the Responses API.
    # Preserve temperature behavior for providers/models that support it.
    if not resolved_model.lower().startswith("gpt-5.6"):
        request_kwargs["temperature"] = temperature

    response = await client.responses.parse(**request_kwargs)

    parsed = response.output_parsed
    if parsed is None:
        raise LLMResponseError("OpenAI returned no usable structured output")

    usage = response.usage
    usage_info = {
        "provider": "openai",
        "model": response.model or resolved_model,
        "tokens_in": usage.input_tokens if usage else 0,
        "tokens_out": usage.output_tokens if usage else 0,
    }
    return parsed.model_dump(), usage_info


async def _call_gemini(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9, max_tokens: int = 600) -> tuple[dict, dict]:
    """Call Google Gemini API. Returns (result_dict, usage_info)."""
    from google import genai

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    resolved_model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    response = await client.aio.models.generate_content(
        model=resolved_model,
        contents=f"{system_prompt}\n\n{user_prompt}",
        config={
            "response_mime_type": "application/json",
            "temperature": temperature,
            "max_output_tokens": max_tokens,
        },
    )

    # Gemini usage metadata (if available)
    usage_meta = getattr(response, 'usage_metadata', None)
    usage_info = {
        "provider": "gemini",
        "model": resolved_model,
        "tokens_in": getattr(usage_meta, 'prompt_token_count', 0) if usage_meta else 0,
        "tokens_out": getattr(usage_meta, 'candidates_token_count', 0) if usage_meta else 0,
    }
    return json.loads(response.text), usage_info


async def _call_openrouter(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9, max_tokens: int = 600) -> tuple[dict, dict]:
    """Call OpenRouter API (uses OpenAI-compatible SDK). Returns (result_dict, usage_info)."""
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

    resolved_model = model or os.getenv("OPENROUTER_DEFAULT_MODEL", "openrouter/free")

    response = await client.chat.completions.create(
        model=resolved_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=temperature,
        max_tokens=max_tokens,
    )

    content = response.choices[0].message.content
    usage = response.usage
    usage_info = {
        "provider": "openrouter",
        "model": getattr(response, "model", None) or resolved_model,
        "tokens_in": usage.prompt_tokens if usage else 0,
        "tokens_out": usage.completion_tokens if usage else 0,
    }
    return json.loads(content), usage_info


# ── Dispatch helper ───────────────────────────────────────────────────

async def _dispatch_llm_call(
    system_prompt: str,
    user_prompt: str,
    provider: str,
    model: str | None = None,
    temperature: float = 0.9,
    max_tokens: int = 600,
    *,
    allow_model_fallback: bool = True,
    response_model: type[BaseModel] | None = None,
) -> dict:
    """Route a call to the correct LLM provider with budget enforcement."""
    # Budget gate — blocks if daily cap exceeded
    budget_tracker.check_budget()

    resolved_model = model
    if provider == "openrouter" and resolved_model is None:
        resolved_model = os.getenv(
            "OPENROUTER_DEFAULT_MODEL",
            "openrouter/free",
        )
    if provider == "openrouter" and _is_openrouter_model_unavailable(
        resolved_model
    ):
        fallback_model = _cheap_model_for_provider(provider)
        if (
            allow_model_fallback
            and fallback_model
            and fallback_model != resolved_model
            and not _is_openrouter_model_unavailable(fallback_model)
        ):
            logger.warning(
                "Skipping unavailable OpenRouter model=%s; using model=%s",
                resolved_model,
                fallback_model,
            )
            resolved_model = fallback_model
        else:
            raise LLMResponseError(
                f"OpenRouter model is temporarily unavailable: {resolved_model}"
            )
    if (
        allow_model_fallback
        and resolved_model is None
        and budget_tracker.should_use_fallback_model()
    ):
        resolved_model = _cheap_model_for_provider(provider)
        if resolved_model:
            logger.warning(
                "LLM fallback model active for provider=%s model=%s active_calls=%s",
                provider,
                resolved_model,
                budget_tracker.active_calls,
            )

    budget_tracker.begin_call()
    try:
        try:
            if provider == "gemini":
                result, usage = await _call_gemini(system_prompt, user_prompt, resolved_model, temperature, max_tokens)
            elif provider == "openrouter":
                result, usage = await _call_openrouter(system_prompt, user_prompt, resolved_model, temperature, max_tokens)
            else:
                result, usage = await _call_openai(
                    system_prompt,
                    user_prompt,
                    resolved_model,
                    temperature,
                    max_tokens,
                    response_model=response_model or AgentLLMResponse,
                )
        except BudgetExceededError:
            raise
        except Exception as error:
            _mark_openrouter_model_unavailable(resolved_model, error)
            if not allow_model_fallback:
                raise
            cheap_model = _cheap_model_for_provider(provider)
            if not cheap_model or cheap_model == resolved_model:
                raise

            logger.warning("Primary LLM call failed; retrying provider=%s with cheap_model=%s", provider, cheap_model)
            if provider == "gemini":
                result, usage = await _call_gemini(system_prompt, user_prompt, cheap_model, temperature, max_tokens)
            elif provider == "openrouter":
                try:
                    result, usage = await _call_openrouter(
                        system_prompt, user_prompt, cheap_model, temperature, max_tokens
                    )
                except Exception as fallback_error:
                    _mark_openrouter_model_unavailable(cheap_model, fallback_error)
                    raise
            else:
                result, usage = await _call_openai(
                    system_prompt,
                    user_prompt,
                    cheap_model,
                    temperature,
                    max_tokens,
                    response_model=response_model or AgentLLMResponse,
                )


        if response_model is not None:
            result = response_model.model_validate(result).model_dump(mode="json")
        # Log usage for tracking
        budget_tracker.log_usage(
            provider=usage["provider"],
            model=usage["model"],
            tokens_in=usage["tokens_in"],
            tokens_out=usage["tokens_out"],
        )
    finally:
        budget_tracker.end_call()

    return result


# ── Response Validator ─────────────────────────────────────────────────

def _validate_agent_response(result: dict, agent: dict, agenda: dict | None = None) -> dict:
    """
    Validate and sanitize LLM output for structural consistency.
    Ensures all required fields are present, within expected ranges,
    and the chosen action is valid for the current phase.
    Returns the corrected result dict.
    """
    # 1. Ensure required string fields are not empty
    if not result.get("public_message") or len(result["public_message"].strip()) < 3:
        result["public_message"] = f"*{agent['name']} pauses, gathering thoughts...*"
        logger.warning(f"Agent {agent['name']}: empty public_message — using fallback")

    if not result.get("internal_thought") or len(result["internal_thought"].strip()) < 3:
        result["internal_thought"] = "Processing the situation..."

    # 2. Validate state_changes ranges (clamp to reasonable bounds)
    sc = result.get("state_changes", {})
    for key in ("morale", "stress", "loyalty", "productivity"):
        val = sc.get(key, 0)
        if not isinstance(val, (int, float)):
            try:
                val = int(val)
            except (ValueError, TypeError):
                val = 0
        # Clamp to [-30, 30] to prevent extreme single-round swings
        sc[key] = max(-30, min(30, int(val)))
    result["state_changes"] = sc

    # 3. Validate action is in the expected set
    valid_actions = set(agenda.get("expected_actions", [])) if agenda else set()
    valid_actions.add("do_nothing")  # Always valid
    valid_actions.add("reflect")     # Generic valid action
    action = result.get("action", "do_nothing")
    if action not in valid_actions and valid_actions:
        logger.warning(
            f"Agent {agent['name']}: action '{action}' not in expected set {valid_actions} — allowing but logging"
        )

    # 4. If agent is in critical state, ensure the response reflects it
    state = agent.get("state", {})
    morale = state.get("morale", 70)
    stress = state.get("stress", 30)
    if morale < 20 and sc.get("morale", 0) > 5:
        # Agent at very low morale gaining lots of morale — suspicious
        logger.info(
            f"Agent {agent['name']}: low morale ({morale}) but positive morale change (+{sc['morale']}) — capping"
        )
        sc["morale"] = min(sc["morale"], 3)
    if stress > 85 and sc.get("stress", 0) < -10:
        # Near-burnout agent recovering too fast
        sc["stress"] = max(sc["stress"], -5)

    return result


# ── Public API ────────────────────────────────────────────────────────

async def generate_agent_response(
    agent: dict,
    company: dict,
    crisis_description: str,
    round_num: int,
    total_rounds: int,
    conversation_history: list[dict],
    intervention: str | None = None,
    memory: str = "",
    agenda: dict | None = None,
    decision_context: str = "",
    world_state_text: str = "",
    hierarchy_desc: str = "",
    hidden_agenda: str = "",
    action_consequences: str = "",
    strict_llm: bool = False,
) -> dict:
    """
    Generate an agent's response using the configured LLM provider.
    Supports per-agent model override via agent['model'].
    Now includes memory, agenda, world state, hierarchy, hidden agendas, and consequences.
    Returns dict with public_message, internal_thought, state_changes, memory_update, action.
    """
    system_prompt = _build_agent_system_prompt(
        agent, company, crisis_description,
        memory=memory,
        agenda=agenda,
        decision_context=decision_context,
        world_state_text=world_state_text,
        hierarchy_desc=hierarchy_desc,
        hidden_agenda=hidden_agenda,
        action_consequences=action_consequences,
    )
    user_prompt = _build_round_user_prompt(
        round_num, total_rounds, conversation_history, intervention,
        agent_name=agent["name"],
    )

    # Resolve per-agent provider/model
    agent_model = agent.get("model")
    provider, model = _resolve_provider_and_model(agent_model)
    temperature = _compute_temperature(agent)

    try:
        logger.info(
            f"Agent {agent['name']} → provider={provider}, model={model or 'default'}, temp={temperature}"
        )
        result = await _dispatch_llm_call(
            system_prompt,
            user_prompt,
            provider,
            model,
            temperature,
            allow_model_fallback=not strict_llm,
            response_model=AgentLLMResponse,
        )

        # Ensure all expected fields exist with defaults
        result.setdefault("public_message", "*stays silent*")
        result.setdefault("internal_thought", "...")
        result.setdefault("state_changes", {})
        result.setdefault("memory_update", "")
        result.setdefault("action", "do_nothing")
        result.setdefault("action_detail", "")

        # Validate and sanitize the response
        result = _validate_agent_response(result, agent, agenda)

        return result

    except Exception as e:
        logger.error(f"LLM call failed for {agent['name']} (provider={provider}): {e}")

        if strict_llm:
            raise LLMResponseError(
                f"GPT-5.6 could not complete the response for {agent['name']}"
            ) from e

        # Fallback: try global provider if per-agent failed
        if agent_model and provider != LLM_PROVIDER:
            try:
                logger.warning(f"Falling back to global provider '{LLM_PROVIDER}' for {agent['name']}")
                result = await _dispatch_llm_call(
                    system_prompt,
                    user_prompt,
                    LLM_PROVIDER,
                    None,
                    temperature,
                    response_model=AgentLLMResponse,
                )
                result.setdefault("public_message", "*stays silent*")
                result.setdefault("internal_thought", "...")
                result.setdefault("state_changes", {})
                result.setdefault("memory_update", "")
                result.setdefault("action", "do_nothing")
                result.setdefault("action_detail", "")
                result = _validate_agent_response(result, agent, agenda)
                return result
            except Exception as fallback_err:
                logger.error(f"Fallback also failed for {agent['name']}: {fallback_err}")

        # Final fallback response
        return {
            "public_message": f"*{agent['name']} stays silent, looking stressed.*",
            "internal_thought": "I can't even formulate my thoughts right now...",
            "state_changes": {"morale": -5, "stress": 5, "loyalty": -2, "productivity": -3},
            "memory_update": "Everything is falling apart and I can't even think straight.",
            "action": "do_nothing",
            "action_detail": "",
        }


def _build_metric_grounded_report(
    company: dict,
    crisis: str,
    agents_data: list[dict],
    total_rounds: int,
    outcome: dict | None,
) -> dict:
    """Build a complete report when the provider output cannot be trusted."""
    total_agents = len(agents_data)
    active_agents = [
        agent for agent in agents_data if not agent.get("has_resigned")
    ]
    resigned_agents = [
        agent for agent in agents_data if agent.get("has_resigned")
    ]
    measured_agents = active_agents or agents_data

    def average(metric: str, default: int = 0) -> int:
        if not measured_agents:
            return default
        return sum(
            int(agent.get("state", {}).get(metric, default))
            for agent in measured_agents
        ) // len(measured_agents)

    avg_morale = average("morale")
    avg_stress = average("stress")
    avg_productivity = average("productivity")
    avg_loyalty = average("loyalty")
    lowest_morale_agent = min(
        measured_agents,
        key=lambda agent: agent.get("state", {}).get("morale", 100),
        default=None,
    )
    highest_stress_agent = max(
        agents_data,
        key=lambda agent: agent.get("state", {}).get("stress", 0),
        default=None,
    )
    outcome_title = (outcome or {}).get("title", "Unclassified Outcome")
    outcome_description = (outcome or {}).get(
        "description",
        "The final team state requires review.",
    )
    resigned_names = ", ".join(
        agent.get("name", "Unknown")
        for agent in resigned_agents
    )

    critical_parts = [
        f"Active-team morale ended at {avg_morale}% and stress at {avg_stress}%."
    ]
    if lowest_morale_agent:
        critical_parts.append(
            f"{lowest_morale_agent.get('name', 'The lowest-morale agent')} "
            f"finished at {lowest_morale_agent.get('state', {}).get('morale', 0)}% morale."
        )
    if resigned_names:
        critical_parts.append(
            f"{resigned_names} resigned during the simulation."
        )

    analysis_parts = [
        f"Final active-team productivity was {avg_productivity}% and loyalty was {avg_loyalty}%.",
        outcome_description,
    ]
    if highest_stress_agent:
        analysis_parts.append(
            f"{highest_stress_agent.get('name', 'The highest-stress agent')} "
            f"recorded the highest final stress at "
            f"{highest_stress_agent.get('state', {}).get('stress', 0)}%."
        )
    if resigned_agents:
        weeks = ", ".join(
            f"{agent.get('name', 'Unknown')} in Week {agent.get('resigned_week', '?')}"
            for agent in resigned_agents
        )
        analysis_parts.append(f"Recorded resignations: {weeks}.")

    recommendations: list[str] = []
    if avg_morale < 40 and lowest_morale_agent:
        recommendations.append(
            f"Within 7 days, assign the People lead to a recovery plan for "
            f"{lowest_morale_agent.get('name')} and raise active-team morale from {avg_morale}%."
        )
    if avg_stress > 60 and highest_stress_agent:
        recommendations.append(
            f"Cap work in progress immediately for {highest_stress_agent.get('name')}, "
            f"whose final stress reached {highest_stress_agent.get('state', {}).get('stress', 0)}%."
        )
    if resigned_agents:
        recommendations.append(
            f"Complete documented exit and retention reviews for {resigned_names} "
            "before the next crisis exercise."
        )
    if avg_productivity < 70:
        recommendations.append(
            f"Create a two-week recovery backlog with one accountable owner to improve "
            f"productivity from the final {avg_productivity}% baseline."
        )
    if avg_loyalty < 50:
        recommendations.append(
            f"Run weekly decision follow-through reviews until active-team loyalty "
            f"improves from {avg_loyalty}%."
        )
    recommendations.append(
        "At every weekly checkpoint, record the decision owner, deadline, trade-off, "
        "and observed morale and stress impact."
    )
    recommendations.append(
        "Repeat the scenario after corrective actions and compare the same final-state metrics."
    )

    unique_recommendations = list(dict.fromkeys(recommendations))[:5]
    while len(unique_recommendations) < 5:
        unique_recommendations.append(
            f"Review Week {len(unique_recommendations) + 1} decisions against the "
            f"{avg_morale}% morale and {avg_stress}% stress baselines."
        )

    result = {
        "executive_summary": (
            f"{company.get('name', 'The company')} completed a {total_rounds}-week "
            f"simulation of {crisis}. The outcome was {outcome_title}, with "
            f"{len(active_agents)} of {total_agents} agents active, final active-team "
            f"morale at {avg_morale}%, and stress at {avg_stress}%."
        ),
        "critical_finding": " ".join(critical_parts),
        "simulation_overview": (
            f"The exercise tested {total_agents} team members over {total_rounds} weeks "
            f"against the scenario: {crisis}. It measured behavioral decisions, retention, "
            "morale, stress, loyalty, and productivity under pressure."
        ),
        "analysis_insights": " ".join(analysis_parts),
        "conclusion": (
            f"The team finished with the {outcome_title} outcome. With morale at "
            f"{avg_morale}%, stress at {avg_stress}%, and {len(resigned_agents)} "
            "resignation(s), the team should not be considered resilient until the "
            "metric-specific corrective actions are verified in a repeat exercise."
        ),
        "recommendations": unique_recommendations,
    }
    return ReportInsights.model_validate(result).model_dump(mode="json")



async def generate_report_insights(
    company: dict,
    crisis: str,
    agents_data: list[dict],
    messages: list[dict],
    total_rounds: int,
    outcome: dict | None = None,
) -> dict:
    """
    Generate a comprehensive, professional post-simulation report.
    Uses the global LLM provider.
    """
    agents_summary = ""
    for a in agents_data:
        state = a.get("state", {})
        agents_summary += (
            f"- {a['name']} ({a['role']}): "
            f"Morale {state.get('morale', '?')}%, "
            f"Stress {state.get('stress', '?')}%, "
            f"Productivity {state.get('productivity', '?')}%, "
            f"Loyalty {state.get('loyalty', '?')}%, "
            f"Resigned: {a.get('has_resigned', False)}"
        )
        if a.get("resigned_week"):
            agents_summary += f" (Week {a['resigned_week']})"
        agents_summary += "\n"

    # Sample of key messages
    key_msgs = [m for m in messages if m.get("type") in ("public", "system")][-20:]
    msgs_text = "\n".join(
        f"[W{m.get('round', '?')}] {m.get('agent_name', 'System')}: {m['content']}"
        for m in key_msgs
    )

    outcome_section = ""
    if outcome:
        outcome_section = f"\nOUTCOME: {outcome.get('emoji', '')} {outcome.get('title', 'Unknown')} — {outcome.get('description', '')}"

    # Compute quick stats for the prompt
    total_agents = len(agents_data)
    resigned_count = sum(1 for a in agents_data if a.get("has_resigned"))
    active_agents = [a for a in agents_data if not a.get("has_resigned")]
    measured_agents = active_agents or agents_data
    measured_count = max(1, len(measured_agents))
    avg_morale = sum(a.get("state", {}).get("morale", 50) for a in measured_agents) // measured_count
    avg_stress = sum(a.get("state", {}).get("stress", 50) for a in measured_agents) // measured_count

    system_prompt = """You are a senior organizational psychologist and management consultant writing a professional post-simulation analysis report.

Your report must be structured, insightful, and actionable — suitable for presentation to C-level executives.

Output Requirements (STRICT):
- Use clear, professional language
- Avoid long unstructured paragraphs — use concise, impactful sentences
- Each section must add unique value — no repetition across sections
- Output must be clean and ready for rendering
- Every section is required and must be non-empty.
- Recommendations must be five unique actions tied to a named agent, metric, owner, or timeframe.
- Treat supplied metrics and outcome as authoritative; never contradict them.
- Never describe a low-morale, high-stress, or resignation outcome as successful.

Respond ONLY with valid JSON in this exact format:
{
  "executive_summary": "A concise 2-3 sentence overview: what was simulated, the key outcome, and the overall team performance verdict.",
  "critical_finding": "The single most critical insight discovered during this simulation (1-2 sentences). This should be specific, data-backed, and actionable.",
  "simulation_overview": "A 2-3 sentence description of the simulation objective, the scenario that was tested, and the key parameters (team size, duration, crisis type).",
  "analysis_insights": "A 3-5 sentence analytical paragraph interpreting the results. Highlight specific bottlenecks, behavioral patterns, leadership dynamics, team cohesion issues, and any notable turning points during the simulation. Reference specific agents or weeks when relevant.",
  "conclusion": "A 2-3 sentence final summary of overall system/team performance. State whether the team would survive a real-world version of this crisis and what the primary risk factor is.",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3", "actionable recommendation 4", "actionable recommendation 5"]
}"""

    user_prompt = f"""COMPANY: {company.get('name', 'Unknown')}
CULTURE: {company.get('culture', 'Unknown')}
CRISIS SCENARIO: {crisis}
SIMULATION DURATION: {total_rounds} weeks
TOTAL AGENTS: {total_agents}
RESIGNATIONS: {resigned_count}
AVERAGE FINAL MORALE: {avg_morale}%
AVERAGE FINAL STRESS: {avg_stress}%
{outcome_section}

AGENT FINAL STATES:
{agents_summary}

KEY CONVERSATION MOMENTS (chronological):
{msgs_text}

Analyze this simulation comprehensively and generate a professional report. Be specific — reference agent names, weeks, and metrics where relevant."""

    fallback_report = _build_metric_grounded_report(
        company,
        crisis,
        agents_data,
        total_rounds,
        outcome,
    )
    last_error: Exception | None = None
    for attempt in range(2):
        current_user_prompt = user_prompt
        if attempt:
            current_user_prompt += (
                "\n\nCORRECTIVE RETRY: The previous response was incomplete or invalid. "
                "Return every required field, five unique recommendations, and no "
                "placeholder or generic review text. Output JSON only."
            )
        try:
            result = await _dispatch_llm_call(
                system_prompt,
                current_user_prompt,
                LLM_PROVIDER,
                temperature=0.3,
                max_tokens=1800,
                response_model=ReportInsights,
            )
            return ReportInsights.model_validate(result).model_dump(mode="json")
        except Exception as error:
            last_error = error
            if attempt == 0:
                logger.warning(
                    "Report output invalid; requesting one corrective retry: %s",
                    error,
                )

    logger.error(
        "Report generation failed after corrective retry: %s",
        last_error,
    )
    return fallback_report


async def generate_tailored_crisis(company_name: str, company_culture: str) -> dict:
    """
    Generate a tailored crisis based on company name and culture.
    Uses the global LLM provider.
    """
    system_prompt = """You are a ruthless corporate scenario planner.
Generate a devastating, highly specific crisis tailored to this exact company's culture and industry.
Respond ONLY with valid JSON:
{
  "title": "Short catchy title (e.g. Server Outage on Launch Day)",
  "description": "1-2 sentence detailed description of what happened and why it's a disaster."
}"""

    user_prompt = f"COMPANY NAME: {company_name}\nCULTURE & CONTEXT: {company_culture}\n\nGenerate the crisis."

    try:
        res = await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER)
        res.setdefault("title", "Unknown Crisis")
        res.setdefault("description", "A custom crisis occurred.")
        return res
    except Exception as e:
        logger.error(f"Crisis generation failed: {e}")
        return {
            "title": "Sudden Market Crash", 
            "description": "An unexpected collapse in the market has disrupted our operations."
        }
