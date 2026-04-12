with open("backend/routers/simulation.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
old_imports = """    InterventionRequest, SimulationStatus, AgentState,"""
new_imports = """    InterventionRequest, SimulationStatus, AgentState, GenerateCrisisRequest,"""

if old_imports in content:
    content = content.replace(old_imports, new_imports)
else:
    print("Could not update imports")

# 2. Add endpoint
endpoint = """

@router.post("/generate-crisis")
async def generate_crisis(request: GenerateCrisisRequest):
    \"\"\"Generate a custom crisis tailored to the company using AI.\"\"\"
    from services.llm_service import generate_tailored_crisis
    
    crisis = await generate_tailored_crisis(request.company_name, request.company_culture)
    return crisis

@router.post("/create")"""

if "\n@router.post(\"/create\")" in content:
    content = content.replace("\n@router.post(\"/create\")", endpoint)
else:
    print("Could not insert endpoint")

with open("backend/routers/simulation.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated routers")
