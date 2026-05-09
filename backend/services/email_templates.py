"""
Email Templates — Branded HTML email templates for TeamDynamics.
"""

from __future__ import annotations
import os

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _base_template(content_html: str, cta_url: str | None = None,
                   cta_text: str | None = None, preheader: str = "") -> str:
    """Base responsive HTML email template with TeamDynamics branding."""
    cta_block = ""
    if cta_url and cta_text:
        cta_block = f'''
        <tr><td align="center" style="padding:32px 0 16px;">
          <a href="{cta_url}" target="_blank"
             style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#7c3aed,#6d28d9);
                    color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;
                    box-shadow:0 4px 20px rgba(124,58,237,0.3);">
            {cta_text}
          </a>
        </td></tr>'''

    unsub_url = f"{FRONTEND_URL}/settings/email"
    return f'''<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>TeamDynamics</title></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">{preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td align="center" style="padding-bottom:32px;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:10px;vertical-align:middle;">
      <div style="width:36px;height:36px;background:#18181b;border:1px solid rgba(124,58,237,0.3);
                  border-radius:10px;text-align:center;line-height:36px;font-size:18px;font-weight:800;color:#7c3aed;">T</div>
    </td>
    <td style="vertical-align:middle;">
      <span style="font-size:20px;font-weight:800;color:#fafafa;letter-spacing:-0.5px;">TeamDynamics</span>
    </td>
  </tr></table>
</td></tr>
<tr><td>
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
    <tr><td style="height:3px;background:linear-gradient(90deg,#7c3aed,#6d28d9,#7c3aed);"></td></tr>
    <tr><td style="padding:40px 36px;">
      {content_html}
      {cta_block}
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding:28px 0;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;color:#71717a;">You're receiving this because you signed up for TeamDynamics.</p>
  <a href="{unsub_url}" target="_blank" style="font-size:12px;color:#71717a;text-decoration:underline;">Manage email preferences</a>
</td></tr>
</table></td></tr></table></body></html>'''


def _card(title: str, desc: str) -> str:
    return f'''<tr><td style="padding:12px;background:#0f0f12;border:1px solid #27272a;border-radius:12px;">
<p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#fafafa;">{title}</p>
<p style="margin:0;font-size:13px;color:#71717a;">{desc}</p></td></tr><tr><td style="height:8px;"></td></tr>'''


def welcome_email(user_name: str) -> dict:
    first = user_name.split()[0] if user_name else "there"
    content = f'''
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#fafafa;">Welcome aboard, {first}! 🎉</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.7;">
      You've unlocked the power to <strong style="color:#fafafa;">predict team breakdowns before they happen</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#0f0f12;border:1px solid #27272a;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#fafafa;text-transform:uppercase;letter-spacing:1px;">Quick Start:</p>
      <p style="margin:0;padding:6px 0;font-size:14px;color:#a1a1aa;"><span style="color:#7c3aed;font-weight:700;">①</span> Set your company profile &amp; pick a crisis</p>
      <p style="margin:0;padding:6px 0;font-size:14px;color:#a1a1aa;"><span style="color:#7c3aed;font-weight:700;">②</span> Assemble your AI team (or use presets!)</p>
      <p style="margin:0;padding:6px 0;font-size:14px;color:#a1a1aa;"><span style="color:#7c3aed;font-weight:700;">③</span> Watch the drama unfold in real-time</p>
    </td></tr></table>
    <p style="margin:0;font-size:14px;color:#a1a1aa;">You have <strong style="color:#7c3aed;">10 free simulation credits</strong> to get started.</p>'''
    return {
        "subject": "🎉 Welcome to TeamDynamics — Your First Simulation Awaits",
        "html": _base_template(content, f"{FRONTEND_URL}/setup", "Launch Your First Simulation →",
                               "Predict your team's breaking point before it happens."),
    }


def meet_your_team_email(user_name: str) -> dict:
    first = user_name.split()[0] if user_name else "there"
    content = f'''
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#fafafa;">Meet Your AI Team, {first} 🧠</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.7;">
      Each agent has a unique <strong style="color:#fafafa;">personality DNA</strong> that shapes how they react under pressure.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    {_card("🔧 Alex — Tech Lead", "Strict, burned out, high assertiveness. Pushes back hard but delivers.")}
    {_card("🚀 Sam — Junior Dev", "Ambitious, naive, low stress tolerance. Eager but cracks under pressure.")}
    {_card("💡 Jordan — PM", "Empathetic, diplomatic. Holds the team together but may avoid hard decisions.")}
    </table>
    <p style="margin:0;font-size:14px;color:#a1a1aa;">
      <strong style="color:#fafafa;">5 personality traits</strong> control each agent — or <strong style="color:#7c3aed;">create your own</strong>!
    </p>'''
    return {
        "subject": "🧠 Meet Your AI Team — How Personality Shapes the Simulation",
        "html": _base_template(content, f"{FRONTEND_URL}/setup", "Build Your Custom Team →",
                               "Alex, Sam, Jordan — they each react differently to pressure."),
    }


def inject_chaos_email(user_name: str) -> dict:
    first = user_name.split()[0] if user_name else "there"
    content = f'''
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#fafafa;">Time to Inject Chaos, {first} ⚡</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.7;">
      Here are <strong style="color:#fafafa;">4 ready-made crisis scenarios</strong> waiting for you:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#0f0f12;border:1px solid #27272a;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:14px;">
      <p style="margin:0;padding:8px 0;font-size:14px;color:#a1a1aa;border-bottom:1px solid #1f1f23;">💻 <strong style="color:#fafafa;">Mandatory Weekend Coding</strong></p>
      <p style="margin:0;padding:8px 0;font-size:14px;color:#a1a1aa;border-bottom:1px solid #1f1f23;">✂️ <strong style="color:#fafafa;">30% Layoffs</strong></p>
      <p style="margin:0;padding:8px 0;font-size:14px;color:#a1a1aa;border-bottom:1px solid #1f1f23;">👤 <strong style="color:#fafafa;">CEO Resigns</strong></p>
      <p style="margin:0;padding:8px 0;font-size:14px;color:#a1a1aa;">🔥 <strong style="color:#fafafa;">Database Deleted</strong></p>
    </td></tr></table>
    <p style="margin:0;font-size:14px;color:#a1a1aa;">Or let <strong style="color:#7c3aed;">AI auto-generate</strong> a custom crisis!</p>'''
    return {
        "subject": "⚡ Inject Chaos — 4 Crisis Scenarios You Can Test Today",
        "html": _base_template(content, f"{FRONTEND_URL}/setup", "Start a Crisis Simulation →",
                               "Weekend coding mandates, layoffs, CEO resignation — pick your poison."),
    }


def understand_reports_email(user_name: str) -> dict:
    first = user_name.split()[0] if user_name else "there"
    content = f'''
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#fafafa;">Your Reports, Decoded 📊</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.7;">
      Great job, {first}! Each report is an <strong style="color:#fafafa;">AI-generated executive analysis</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#0f0f12;border:1px solid #27272a;border-radius:12px;margin-bottom:20px;">
    <tr><td style="padding:20px;">
      <p style="margin:0;padding:5px 0;font-size:14px;color:#a1a1aa;">📝 <strong style="color:#d4d4d8;">Executive Summary</strong></p>
      <p style="margin:0;padding:5px 0;font-size:14px;color:#a1a1aa;">🎯 <strong style="color:#d4d4d8;">Critical Finding</strong></p>
      <p style="margin:0;padding:5px 0;font-size:14px;color:#a1a1aa;">📈 <strong style="color:#d4d4d8;">Timeline Charts</strong></p>
      <p style="margin:0;padding:5px 0;font-size:14px;color:#a1a1aa;">👥 <strong style="color:#d4d4d8;">Agent Status Cards</strong></p>
      <p style="margin:0;padding:5px 0;font-size:14px;color:#a1a1aa;">💡 <strong style="color:#d4d4d8;">5 Recommendations</strong></p>
    </td></tr></table>
    <p style="margin:0;font-size:14px;color:#a1a1aa;">Pro tip: <strong style="color:#7c3aed;">Export reports as PDF</strong> to share with stakeholders!</p>'''
    return {
        "subject": "📊 From Burnout to Breakthrough — Understanding Your Reports",
        "html": _base_template(content, f"{FRONTEND_URL}/dashboard", "View Your Reports →",
                               "Executive summaries, timeline charts, and actionable insights."),
    }


def advanced_features_email(user_name: str) -> dict:
    first = user_name.split()[0] if user_name else "there"
    content = f'''
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:800;color:#fafafa;">Level Up, {first} 🚀</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.7;">
      Time to unlock the <strong style="color:#fafafa;">advanced features</strong> that power users love:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
    {_card("🎮 God Mode Interventions", "Drop bonuses, pizza parties, or cancel overtime mid-simulation.")}
    {_card("🔀 A/B Compare", "Run the same crisis with different teams and compare outcomes.")}
    {_card("📄 Document Analysis", "Upload company docs — AI extracts risks and auto-configures agents.")}
    {_card("🤖 Multi-LLM Agents", "Assign different AI models per agent for behavioral diversity.")}
    </table>
    <p style="margin:0;font-size:14px;color:#a1a1aa;">Thanks for being part of TeamDynamics! 🙌</p>'''
    return {
        "subject": "🚀 Level Up — Advanced Features & Pro Tips",
        "html": _base_template(content, f"{FRONTEND_URL}/setup", "Try Advanced Features →",
                               "God Mode, A/B Compare, Document Analysis, Multi-LLM Agents."),
    }


# ── Template Registry ─────────────────────────────────────────────────

TEMPLATE_REGISTRY: dict[str, callable] = {
    "welcome": welcome_email,
    "meet_your_team": meet_your_team_email,
    "inject_chaos": inject_chaos_email,
    "understand_reports": understand_reports_email,
    "advanced_features": advanced_features_email,
}


def render_template(template_name: str, user_name: str) -> dict:
    """Render an email template by name. Returns {"subject": str, "html": str}."""
    fn = TEMPLATE_REGISTRY.get(template_name)
    if not fn:
        raise KeyError(f"Unknown email template: {template_name}")
    return fn(user_name)
