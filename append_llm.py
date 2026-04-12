with open("backend/services/llm_service.py", "a", encoding="utf-8") as f:
    f.write('''

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

    user_prompt = f"COMPANY NAME: {company_name}\\nCULTURE & CONTEXT: {company_culture}\\n\\nGenerate the crisis."

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
''')
print("Appended llm_service")
