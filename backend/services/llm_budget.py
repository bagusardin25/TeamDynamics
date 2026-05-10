"""
LLM Budget Tracker — Monitors token usage and enforces daily spending caps.

Architecture:
- In-memory counter for real-time tracking (fast, no DB overhead per call)
- Persisted to DB via periodic flush (APScheduler or on-demand)
- Daily budget cap: blocks new LLM calls when exceeded
- Admin-only API for viewing/configuring

Usage in llm_service.py:
    from services.llm_budget import budget_tracker
    budget_tracker.check_budget()          # raises if over cap
    budget_tracker.log_usage(provider, model, tokens_in, tokens_out, cost)
"""

from __future__ import annotations

import os
import logging
from datetime import datetime, timezone, date
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# ── Cost per 1K tokens (approximate, conservative estimates) ──────────
# Used for estimation when actual cost isn't available from the API response.
COST_PER_1K_TOKENS: dict[str, dict[str, float]] = {
    # OpenAI
    "gpt-4o-mini":      {"input": 0.00015, "output": 0.0006},
    "gpt-4o":           {"input": 0.0025,  "output": 0.01},
    "gpt-4-turbo":      {"input": 0.01,    "output": 0.03},
    # Gemini
    "gemini-2.0-flash":  {"input": 0.0,    "output": 0.0},     # Free tier
    "gemini-1.5-pro":    {"input": 0.00125,"output": 0.005},
    # OpenRouter (varies — use conservative estimate)
    "default":           {"input": 0.001,  "output": 0.002},
}


def _estimate_cost(model: str, tokens_in: int, tokens_out: int) -> float:
    """Estimate cost in USD based on model and token counts."""
    pricing = COST_PER_1K_TOKENS.get(model, COST_PER_1K_TOKENS["default"])
    cost = (tokens_in / 1000) * pricing["input"] + (tokens_out / 1000) * pricing["output"]
    return round(cost, 6)


@dataclass
class DailyUsage:
    """Tracks LLM usage for a single day."""
    date: str                              # YYYY-MM-DD
    total_calls: int = 0
    total_tokens_in: int = 0
    total_tokens_out: int = 0
    estimated_cost_usd: float = 0.0
    calls_by_provider: dict[str, int] = field(default_factory=dict)
    calls_by_model: dict[str, int] = field(default_factory=dict)
    calls_blocked: int = 0                 # Calls blocked by budget cap


class BudgetExceededError(Exception):
    """Raised when the daily LLM budget cap has been reached."""
    def __init__(self, daily_cap: float, current_spend: float):
        self.daily_cap = daily_cap
        self.current_spend = current_spend
        super().__init__(
            f"Daily LLM budget exceeded: ${current_spend:.4f} / ${daily_cap:.2f} cap. "
            f"All LLM calls are paused until midnight UTC."
        )


class LLMBudgetTracker:
    """
    Tracks LLM API usage and enforces a daily spending cap.

    The cap is configurable via LLM_DAILY_BUDGET_USD env var.
    Set to 0 to disable budget enforcement (not recommended in production).
    """

    def __init__(self):
        self._daily_cap = float(os.getenv("LLM_DAILY_BUDGET_USD", "5.00"))
        self._fallback_threshold_pct = float(os.getenv("LLM_FALLBACK_BUDGET_THRESHOLD_PCT", "80"))
        self._traffic_spike_active_calls = int(os.getenv("LLM_TRAFFIC_SPIKE_ACTIVE_CALLS", "10"))
        self._active_calls = 0
        self._today: DailyUsage | None = None
        self._history: list[dict] = []   # Last 30 days summary
        logger.info(
            f"💰 LLM Budget Tracker initialized — "
            f"daily cap: ${self._daily_cap:.2f}"
            f"{' (DISABLED)' if self._daily_cap <= 0 else ''}"
        )

    @property
    def daily_cap(self) -> float:
        return self._daily_cap

    @daily_cap.setter
    def daily_cap(self, value: float):
        self._daily_cap = max(0.0, value)
        logger.info(f"💰 LLM daily budget cap updated to ${self._daily_cap:.2f}")

    def _get_today(self) -> DailyUsage:
        """Get or create today's usage tracker. Rolls over at midnight UTC."""
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if self._today is None or self._today.date != today_str:
            # Archive yesterday
            if self._today is not None:
                self._history.append(self._today_summary())
                # Keep only last 30 days
                if len(self._history) > 30:
                    self._history = self._history[-30:]
            # Start new day
            self._today = DailyUsage(date=today_str)
        return self._today

    def check_budget(self) -> None:
        """
        Check if we're within the daily budget. Raises BudgetExceededError if over cap.
        Call this BEFORE making an LLM call.
        """
        if self._daily_cap <= 0:
            return  # Budget enforcement disabled

        today = self._get_today()
        if today.estimated_cost_usd >= self._daily_cap:
            today.calls_blocked += 1
            raise BudgetExceededError(self._daily_cap, today.estimated_cost_usd)

    def begin_call(self) -> None:
        """Track in-flight LLM calls for traffic-spike fallback decisions."""
        self._active_calls += 1

    def end_call(self) -> None:
        """Release an in-flight LLM call counter."""
        self._active_calls = max(0, self._active_calls - 1)

    @property
    def active_calls(self) -> int:
        return self._active_calls

    def should_use_fallback_model(self) -> bool:
        """Return True when cost pressure or concurrent traffic should use cheaper models."""
        if os.getenv("LLM_FALLBACK_ENABLED", "true").lower() not in {"1", "true", "yes"}:
            return False

        today = self._get_today()
        budget_pressure = (
            self._daily_cap > 0
            and today.estimated_cost_usd >= self._daily_cap * (self._fallback_threshold_pct / 100)
        )
        traffic_spike = self._active_calls >= self._traffic_spike_active_calls
        return budget_pressure or traffic_spike

    def log_usage(
        self,
        provider: str,
        model: str,
        tokens_in: int = 0,
        tokens_out: int = 0,
        actual_cost: float | None = None,
    ) -> None:
        """
        Log a completed LLM call. Call this AFTER the API response.

        Args:
            provider: "openai", "gemini", "openrouter"
            model: The specific model used (e.g., "gpt-4o-mini")
            tokens_in: Input/prompt tokens
            tokens_out: Output/completion tokens
            actual_cost: Actual cost if available from API (otherwise estimated)
        """
        today = self._get_today()
        today.total_calls += 1
        today.total_tokens_in += tokens_in
        today.total_tokens_out += tokens_out

        cost = actual_cost if actual_cost is not None else _estimate_cost(model, tokens_in, tokens_out)
        today.estimated_cost_usd += cost

        today.calls_by_provider[provider] = today.calls_by_provider.get(provider, 0) + 1
        today.calls_by_model[model] = today.calls_by_model.get(model, 0) + 1

        logger.debug(
            f"💰 LLM call: {provider}/{model} — "
            f"{tokens_in}+{tokens_out} tokens, ~${cost:.5f} "
            f"(daily total: ${today.estimated_cost_usd:.4f}/{self._daily_cap:.2f})"
        )

        # Warn at 80% usage
        if self._daily_cap > 0 and today.estimated_cost_usd >= self._daily_cap * 0.8:
            remaining_pct = (1 - today.estimated_cost_usd / self._daily_cap) * 100
            logger.warning(
                f"⚠️ LLM budget at {100 - remaining_pct:.0f}% — "
                f"${today.estimated_cost_usd:.4f} / ${self._daily_cap:.2f}"
            )

    def _today_summary(self) -> dict:
        """Get a summary dict for today's usage."""
        today = self._get_today()
        return {
            "date": today.date,
            "total_calls": today.total_calls,
            "total_tokens_in": today.total_tokens_in,
            "total_tokens_out": today.total_tokens_out,
            "total_tokens": today.total_tokens_in + today.total_tokens_out,
            "estimated_cost_usd": round(today.estimated_cost_usd, 6),
            "calls_by_provider": dict(today.calls_by_provider),
            "calls_by_model": dict(today.calls_by_model),
            "calls_blocked": today.calls_blocked,
            "budget_remaining_usd": round(max(0, self._daily_cap - today.estimated_cost_usd), 6),
            "budget_used_pct": round(
                (today.estimated_cost_usd / self._daily_cap * 100) if self._daily_cap > 0 else 0, 1
            ),
        }

    def get_usage_stats(self) -> dict:
        """Get comprehensive usage stats for the admin dashboard."""
        today = self._today_summary()
        return {
            "daily_cap_usd": self._daily_cap,
            "cap_enabled": self._daily_cap > 0,
            "fallback_enabled": os.getenv("LLM_FALLBACK_ENABLED", "true").lower() in {"1", "true", "yes"},
            "fallback_threshold_pct": self._fallback_threshold_pct,
            "traffic_spike_active_calls": self._traffic_spike_active_calls,
            "active_calls": self._active_calls,
            "using_fallback_model": self.should_use_fallback_model(),
            "today": today,
            "history": list(self._history),  # Last 30 days
        }


# ── Singleton ─────────────────────────────────────────────────────────
budget_tracker = LLMBudgetTracker()
