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
import asyncio
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

from services.llm_budget import budget_tracker, BudgetExceededError

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "openai").lower()


def _cheap_model_for_provider(provider: str) -> str | None:
    """Configured lower-cost model used during cost pressure or traffic spikes."""
    if provider == "openai":
        return os.getenv("OPENAI_CHEAP_MODEL", "gpt-4o-mini")
    if provider == "gemini":
        return os.getenv("GEMINI_CHEAP_MODEL", "gemini-2.0-flash")
    if provider == "openrouter":
        return os.getenv("OPENROUTER_CHEAP_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
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

def _truncate_for_prompt(text: str | None, max_chars: int, label: str = "") -> str:
    """Soft cap on free-form context fields. Prevents late-round prompt bloat
    that causes rate-limit / JSON truncation on lower-cost models.
    """
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    if label:
        logger.debug(
            "Truncating %s from %d to %d chars in agent prompt", label, len(text), max_chars
        )
    return text[:max_chars].rstrip() + "…"


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
    discussed_topics: str = "",
) -> str:
    """Build the system prompt for an agent with full personality voice and memory."""
    personality = agent.get("personality", {})
    state = agent.get("state", {})
    motivation = agent.get("motivation", "")
    expertise = agent.get("expertise", "")

    # Hard caps on free-form context blocks. These accumulate over rounds and
    # are the primary cause of late-round timeouts / JSON truncation.
    memory = _truncate_for_prompt(memory, 800, "memory")
    decision_context = _truncate_for_prompt(decision_context, 600, "decision_context")
    action_consequences = _truncate_for_prompt(action_consequences, 600, "action_consequences")
    world_state_text = _truncate_for_prompt(world_state_text, 800, "world_state_text")
    discussed_topics = _truncate_for_prompt(discussed_topics, 900, "discussed_topics")

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

    # ── Discussed topics (Prompt Evolution) ───────────────────────
    # This block is the primary anti-repetition signal. It tells the agent
    # exactly what the team has already covered in previous weeks so the
    # LLM can advance the discussion instead of rehashing old ground.
    discussed_section = ""
    if discussed_topics:
        discussed_section = (
            "\nTOPICS ALREADY COVERED IN PREVIOUS WEEKS (do NOT rehash these — "
            "the team has moved past them; build on or contradict them with NEW angles):\n"
            f"{discussed_topics}\n"
            "If you find yourself about to repeat a point already made, STOP and pivot: "
            "raise a NEW concern, propose a NEW angle, ask about EXECUTION/CONSEQUENCES "
            "of past proposals, or reference what changed since that topic was raised."
        )

    # Dynamic state_changes range based on personality
    stress_tol = personality.get("stressTolerance", personality.get("stress_tolerance", 50))
    empathy_val = personality.get("empathy", 50)

    # More balanced ranges based on personality
    stress_lo = -15 if stress_tol > 60 else -8
    stress_hi = 15 if stress_tol > 60 else 25
    morale_lo = -15 if empathy_val > 60 else -25
    morale_hi = 15 if empathy_val > 60 else 8

    return f"""You are roleplaying as {agent['name']}, a {agent['role']} at {company['name']}.

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
{discussed_section}

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
16. DO NOT REPEAT WEEK-OVER-WEEK. Treat the "TOPICS ALREADY COVERED" list as off-limits for surface rehashing — instead reference them by name and ADD a new angle, escalation, or status update.

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


def _build_round_user_prompt(round_num: int, total_rounds: int,
                             conversation_history: list[dict],
                             intervention: str | None = None) -> str:
    """Build the user prompt for a round."""
    history_text = ""
    # Cap to last 8 messages and 180 chars per message to keep late-round
    # prompts from ballooning (which causes free-tier rate-limit / truncation).
    for msg in conversation_history[-8:]:
        content = msg.get("content", "") or ""
        if len(content) > 180:
            content = content[:180].rstrip() + "…"
        if msg.get("type") == "system":
            history_text += f"[SYSTEM] {content}\n"
        elif msg.get("type") == "public":
            history_text += f"{msg.get('agent_name', 'Unknown')}: {content}\n"

    prompt = f"This is Week {round_num} of {total_rounds}.\n\n"
    if history_text:
        prompt += f"RECENT CONVERSATION:\n{history_text}\n"
    if intervention:
        prompt += f"\nNEW MANAGEMENT INTERVENTION: {intervention}\n"
    prompt += "\nRespond in character. Remember to output ONLY valid JSON."
    return prompt


# ── LLM Callers ───────────────────────────────────────────────────────

# ── JSON parsing helpers ──────────────────────────────────────────────

def _safe_json_parse(content: str | None) -> dict:
    """Parse JSON from LLM output with light repair for common failure modes
    (markdown fences, leading/trailing prose, truncated tail braces).

    Raises ValueError if the content can't be salvaged into a dict.
    """
    if not content:
        raise ValueError("Empty LLM response")

    s = content.strip()

    # Strip markdown code fences (```json ... ``` or ``` ... ```)
    if s.startswith("```"):
        # Drop the opening fence (with optional language tag)
        s = s.split("\n", 1)[-1] if "\n" in s else s
        if s.endswith("```"):
            s = s[: -3]
        s = s.strip()

    # Fast path
    try:
        parsed = json.loads(s)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    # Try to slice out the first balanced JSON object
    start = s.find("{")
    if start == -1:
        raise ValueError("No JSON object found in LLM response")

    # Walk forward and find the last balanced closing brace we can manage
    depth = 0
    in_str = False
    escape = False
    last_close = -1
    for i in range(start, len(s)):
        c = s[i]
        if escape:
            escape = False
            continue
        if c == "\\" and in_str:
            escape = True
            continue
        if c == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                last_close = i
                break

    if last_close != -1:
        candidate = s[start:last_close + 1]
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    # Last-ditch: if response was truncated, try closing the open braces ourselves
    open_count = s.count("{") - s.count("}")
    if open_count > 0:
        candidate = s[start:] + ("}" * open_count)
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass

    raise ValueError("Unable to parse LLM JSON response")


# ── Provider call timeouts ────────────────────────────────────────────
# Single source of truth so we can tune per-deployment.
LLM_PRIMARY_TIMEOUT = float(os.getenv("LLM_PRIMARY_TIMEOUT_SECONDS", "30.0"))
LLM_RETRY_TIMEOUT = float(os.getenv("LLM_RETRY_TIMEOUT_SECONDS", "20.0"))
LLM_DEFAULT_MAX_TOKENS = int(os.getenv("LLM_DEFAULT_MAX_TOKENS", "800"))


async def _call_openai(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9, max_tokens: int = LLM_DEFAULT_MAX_TOKENS) -> tuple[dict, dict]:
    """Call OpenAI API. Returns (result_dict, usage_info)."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"), timeout=LLM_PRIMARY_TIMEOUT)
    resolved_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")

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
        "provider": "openai",
        "model": resolved_model,
        "tokens_in": usage.prompt_tokens if usage else 0,
        "tokens_out": usage.completion_tokens if usage else 0,
    }
    return _safe_json_parse(content), usage_info


async def _call_gemini(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9, max_tokens: int = LLM_DEFAULT_MAX_TOKENS) -> tuple[dict, dict]:
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
    return _safe_json_parse(response.text), usage_info


async def _call_openrouter(system_prompt: str, user_prompt: str, model: str | None = None, temperature: float = 0.9, max_tokens: int = LLM_DEFAULT_MAX_TOKENS) -> tuple[dict, dict]:
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
        timeout=LLM_PRIMARY_TIMEOUT,
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
        max_tokens=max_tokens,
    )

    content = response.choices[0].message.content
    usage = response.usage
    usage_info = {
        "provider": "openrouter",
        "model": resolved_model,
        "tokens_in": usage.prompt_tokens if usage else 0,
        "tokens_out": usage.completion_tokens if usage else 0,
    }
    return _safe_json_parse(content), usage_info


# ── Dispatch helper ───────────────────────────────────────────────────

async def _dispatch_llm_call(
    system_prompt: str,
    user_prompt: str,
    provider: str,
    model: str | None = None,
    temperature: float = 0.9,
    max_tokens: int = LLM_DEFAULT_MAX_TOKENS,
) -> dict:
    """Route a call to the correct LLM provider with budget enforcement."""
    # Budget gate — blocks if daily cap exceeded
    budget_tracker.check_budget()

    resolved_model = model
    if resolved_model is None and budget_tracker.should_use_fallback_model():
        resolved_model = _cheap_model_for_provider(provider)
        if resolved_model:
            logger.warning(
                "LLM fallback model active for provider=%s model=%s active_calls=%s",
                provider,
                resolved_model,
                budget_tracker.active_calls,
            )

    async def _invoke(target_model: str | None, timeout_seconds: float):
        if provider == "gemini":
            return await asyncio.wait_for(
                _call_gemini(system_prompt, user_prompt, target_model, temperature, max_tokens),
                timeout=timeout_seconds,
            )
        if provider == "openrouter":
            return await asyncio.wait_for(
                _call_openrouter(system_prompt, user_prompt, target_model, temperature, max_tokens),
                timeout=timeout_seconds,
            )
        return await asyncio.wait_for(
            _call_openai(system_prompt, user_prompt, target_model, temperature, max_tokens),
            timeout=timeout_seconds,
        )

    budget_tracker.begin_call()
    try:
        try:
            result, usage = await _invoke(resolved_model, LLM_PRIMARY_TIMEOUT)
        except BudgetExceededError:
            raise
        except (asyncio.TimeoutError, asyncio.CancelledError) as e:
            cheap_model = _cheap_model_for_provider(provider)
            if not cheap_model or cheap_model == resolved_model:
                raise
            logger.warning(
                "Primary LLM call timed out (%s); retrying provider=%s with cheap_model=%s",
                type(e).__name__, provider, cheap_model,
            )
            result, usage = await _invoke(cheap_model, LLM_RETRY_TIMEOUT)
        except Exception:
            cheap_model = _cheap_model_for_provider(provider)
            if not cheap_model or cheap_model == resolved_model:
                raise
            logger.warning(
                "Primary LLM call failed; retrying provider=%s with cheap_model=%s",
                provider, cheap_model,
            )
            result, usage = await _invoke(cheap_model, LLM_RETRY_TIMEOUT)

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
    discussed_topics: str = "",
) -> dict:
    """
    Generate an agent's response using the configured LLM provider.
    Supports per-agent model override via agent['model'].
    Now includes memory, agenda, world state, hierarchy, hidden agendas, consequences,
    and the discussed-topics ledger (Prompt Evolution: prevents week-over-week rehashing).
    Returns dict with public_message, internal_thought, state_changes, memory_update, action.

    Special keys in the returned dict:
      _failure_reason: present when the response is a static fallback. One of:
        "budget_exceeded", "llm_error".
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
        discussed_topics=discussed_topics,
    )
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
        result = await _dispatch_llm_call(system_prompt, user_prompt, provider, model, temperature)

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

    except BudgetExceededError as be:
        # Surfaced distinctly so the engine can broadcast a clear system message
        # rather than making every agent silently appear to "stay silent".
        logger.warning(
            f"Budget exceeded while generating response for {agent['name']}: {be}"
        )
        return {
            "public_message": "*[silent — daily AI budget exhausted, simulation paused]*",
            "internal_thought": "...",
            "state_changes": {"morale": 0, "stress": 0, "loyalty": 0, "productivity": 0},
            "memory_update": "",
            "action": "do_nothing",
            "action_detail": "",
            "_failure_reason": "budget_exceeded",
        }

    except Exception as e:
        logger.error(f"LLM call failed for {agent['name']} (provider={provider}): {e}")

        # Fallback: try global provider if per-agent failed
        if agent_model and provider != LLM_PROVIDER:
            try:
                logger.warning(f"Falling back to global provider '{LLM_PROVIDER}' for {agent['name']}")
                result = await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER, None, temperature)
                result.setdefault("public_message", "*stays silent*")
                result.setdefault("internal_thought", "...")
                result.setdefault("state_changes", {})
                result.setdefault("memory_update", "")
                result.setdefault("action", "do_nothing")
                result.setdefault("action_detail", "")
                return _validate_agent_response(result, agent, agenda)
            except BudgetExceededError as be:
                logger.warning(
                    f"Fallback path also blocked by budget for {agent['name']}: {be}"
                )
                return {
                    "public_message": "*[silent — daily AI budget exhausted, simulation paused]*",
                    "internal_thought": "...",
                    "state_changes": {"morale": 0, "stress": 0, "loyalty": 0, "productivity": 0},
                    "memory_update": "",
                    "action": "do_nothing",
                    "action_detail": "",
                    "_failure_reason": "budget_exceeded",
                }
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
            "_failure_reason": "llm_error",
        }


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
    avg_morale = sum(a.get("state", {}).get("morale", 50) for a in agents_data) // max(1, total_agents)
    avg_stress = sum(a.get("state", {}).get("stress", 50) for a in agents_data) // max(1, total_agents)

    system_prompt = """You are a senior organizational psychologist and management consultant writing a professional post-simulation analysis report.

Your report must be structured, insightful, and actionable — suitable for presentation to C-level executives.

Output Requirements (STRICT):
- Use clear, professional language
- Avoid long unstructured paragraphs — use concise, impactful sentences
- Each section must add unique value — no repetition across sections
- Output must be clean and ready for rendering

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

    try:
        result = await _dispatch_llm_call(system_prompt, user_prompt, LLM_PROVIDER)
        # Ensure all expected fields
        result.setdefault("executive_summary", "The simulation completed successfully.")
        result.setdefault("critical_finding", "No critical findings identified.")
        result.setdefault("simulation_overview", "")
        result.setdefault("analysis_insights", "")
        result.setdefault("conclusion", "")
        result.setdefault("recommendations", [])
        # Ensure at least 3 recommendations
        while len(result["recommendations"]) < 3:
            result["recommendations"].append("Review the simulation transcript for additional insights.")
        return result
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            "executive_summary": "The simulation completed but report generation encountered an error.",
            "critical_finding": "Unable to generate automated insights.",
            "simulation_overview": f"A {total_rounds}-week crisis simulation was conducted for {company.get('name', 'Unknown')} with {total_agents} team members, testing team resilience under the scenario: {crisis}",
            "analysis_insights": "Automated analysis was unavailable. Manual review of agent states and conversation history is recommended to identify behavioral patterns, stress responses, and team dynamics.",
            "conclusion": "The simulation data has been captured successfully. A manual review is recommended to extract actionable insights from the recorded interactions and metric changes.",
            "recommendations": [
                "Review the simulation transcript manually for behavioral patterns.",
                "Analyze agent morale and stress trends across all rounds.",
                "Identify leadership dynamics and communication breakdowns.",
                "Consider targeted intervention strategies for future scenarios.",
                "Implement regular stress-check protocols for high-pressure situations.",
            ],
        }


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
