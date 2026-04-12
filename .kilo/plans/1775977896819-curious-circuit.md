# Plan: Multi-Provider LLM Support dengan OpenRouter

## Tujuan
Menambahkan dukungan OpenRouter sebagai provider LLM ketiga, dengan kemampuan menggunakan model AI berbeda untuk setiap agent dalam simulasi.

---

## Latar Belakang

Ide ini bagus! Karena:
1. **Varietas Respons**: Model AI berbeda memiliki "kepribadian" berbeda - ada yang lebih kreatif, analitis, atau konservatif
2. **Simulasi Lebih Realistis**: Mirip dunia nyata - setiap orang berpikir berbeda
3. **Fleksibilitas**: OpenRouter menyediakan 100+ model (Anthropic, Mistral, Meta, dll)
4. **Cost Efficiency**: Bisa memilih model cheaper untuk agent tertentu

---

## Arsitektur Perubahan

### 1. Env Config (.env.example)
```env
# Existing
LLM_PROVIDER=openai  # openai, gemini, openrouter

# OpenAI
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

# Gemini  
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.0-flash

# OpenRouter (BARU)
OPENROUTER_API_KEY=...
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct

# Agent-specific overrides (opsional)
# AGENT_MODEL_PREFIX=model-  # prefix untuk agent-specific models
```

### 2. LLM Service (llm_service.py)

#### Opsi A: Agent-specific model assignment
- Setiap agent punya field `model`opsional
- Jika diisi, gunakan model tersebut
- Jika tidak, gunakan default provider

#### Opsi B: Round-robin assignment
- Pertama kali: assign model berbeda ke setiap agent secara round-robin
- Antar simulation: model tetap sama

**Rekomendasi: Opsi A** karena lebih fleksibel dan user bisa customize.

### 3. Perubahan Data Model

#### Schema: Agent Config
```python
class AgentConfig(BaseModel):
    id: str
    name: str
    role: str
    type: str
    color: str
    personality: PersonalityTraits
    model: Optional[str] = None  # BARU: model override
```

#### Preset Agents
Tambahkan model preset per agent:
```python
PRESET_AGENTS = [
    {
        "id": "preset-1",
        "name": "Alex",
        "role": "Tech Lead",
        "model": "anthropic/claude-3.5-sonnet",  # BARU
        ...
    },
    # agent lain bisa pakai model berbeda
]
```

### 4. Perubahan Simulation Engine

#### generate_agent_response() signature
```python
async def generate_agent_response(
    agent: dict,
    company: dict,
    crisis_description: str,
    round_num: int,
    total_rounds: int,
    conversation_history: list[dict],
    intervention: str | None = None,
    provider: str = None,  # BARU: per-agent override
    model: str = None,     # BARU: per-agent model
) -> dict:
```

#### Logic:
1. Check agent.model - jika ada, gunakan itu (termasuk provider info)
2. Jika tidak ada, fallback ke global LLM_PROVIDER
3. Init client sesuai provider yang dipilih

### 5. Provider Implementation

#### OpenRouter Client
```python
async def _call_openrouter(system_prompt: str, user_prompt: str, model: str) -> dict:
    from openai import AsyncOpenAI
    
    client = AsyncOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1"
    )
    
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.9,
        max_tokens=500,
    )
    
    return json.loads(response.choices[0].message.content)
```

### 6. Frontend Integration

Tambahkan field di UI untuk pilih model per agent:
- Dropdown provider (openai/gemini/openrouter) per agent  
- Text input untuk custom model name
- Atau preset dropdown untuk common models

---

## Tahap Implementasi

### Tahap 1: Backend Core
1. Update .env.example - tambah OpenRouter config
2. Update llm_service.py - tambah `_call_openrouter()` dan modifier function signature
3. Update simulation_engine.py - pass agent.model ke generate_agent_response
4. Update schemas.py - tambah field `model` di AgentConfig
5. Update presets.py - contoh assign model berbeda

### Tahap 2: Testing
1. Unit test untuk provider switching
2. Manual test dengan simulation

### Tahap 3: Frontend (Opsional)
1. Tambah UI untuk agent model selection
2. Atau cukup gunakan preset yang sudah ada

---

## Potensi Issues & Mitigation

| Issue | Mitigation |
|-------|------------|
| Model tidak tersedia | Graceful fallback ke default model |
| API key tidak ada | Error message jelas, skip agent |
| Rate limiting | Tambah delay, retry logic |
| Response format不一致 | Better JSON parsing dengan try/except |
