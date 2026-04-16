# Product Requirements Document (PRD)
## TeamDynamics — Multi-Agent Gamified SaaS Simulation
**Version:** 1.0  
**Last Updated:** April 16, 2026  
**Author:** TeamDynamics Engineering  
**Status:** Production Ready (Hackathon Season 2)

---

## 1. Executive Summary

TeamDynamics is a **Multi-Agent Gamified SaaS Simulation** platform designed for startup founders, HR leaders, and organizational strategists to simulate corporate crisis scenarios using AI-driven team members. Users assemble a virtual team of psychologically-profiled AI agents, inject a real-world crisis, and observe how the team reacts in real-time through a Slack-like interface — predicting breaking points, burnout cascades, and team fracture before they happen in real life.

### 1.1 Product Vision

> *"Identify the exact breaking point of your startup before it happens in real life."*

TeamDynamics brings predictive organizational psychology into the hands of decision-makers by combining multi-agent AI simulation with gamified UX. It enables users to stress-test company culture, leadership effectiveness, and team resilience through controllable crisis scenarios with realistic outcomes.

### 1.2 Target Users

| User Persona | Use Case |
|:---|:---|
| **Startup Founders** | Stress-test team composition and leadership under crisis before making real hiring/management decisions |
| **HR Leaders** | Evaluate team dynamics, predict burnout risk, and develop crisis response protocols |
| **Organizational Strategists** | Model restructuring scenarios, layoff impacts, and culture shifts |
| **Team Leads / Engineering Managers** | Understand how crunch-time, overtime, and pressure affect their direct reports |
| **Educators / MBA Programs** | Teaching tool for organizational behavior and crisis management courses |

---

## 2. Product Overview

### 2.1 Core Value Proposition

1. **Predict Before It Happens** — Simulate weeks of crisis in minutes, revealing team fracture points
2. **Deep Psychological Modeling** — 5-trait personality system drives unique agent behaviors (not generic chatbot responses)
3. **Real-Time Observation** — Slack-like surveillance of both public conversations and hidden internal thoughts
4. **God-Mode Interventions** — Change the course of the simulation on-the-fly with management actions
5. **Data-Driven Insights** — Post-simulation AI-generated executive reports with actionable recommendations
6. **BYO-AI** — Mix and match LLM providers (OpenAI, Gemini, OpenRouter) per-agent for behavioral diversity

### 2.2 Key Differentiators

- **Personality-Weighted State Machine**: Unlike generic AI simulations, state changes (morale, stress, productivity, loyalty) are modulated by each agent's unique personality traits
- **World State Engine**: Dynamic economic constraints (budget, reputation, customer satisfaction, technical debt) that make agent decisions consequential
- **Hierarchy-Weighted Decision Engine**: Senior roles carry more influence in team decisions, mirroring real corporate power dynamics
- **Hidden Agendas**: Agents have secret motivations that subtly influence their proposals and alliances — invisible to the user until drama unfolds
- **Persistent Memory**: Agents remember previous rounds and build on earlier discussions

---

## 3. System Architecture

### 3.1 Technology Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Frontend** | Next.js 16 (App Router), React 19 | SPA with server components |
| **UI Framework** | Tailwind CSS v4, shadcn/ui | Component library and styling |
| **Animations** | Framer Motion | Page transitions, micro-animations |
| **Charts** | Recharts | Timeline analytics and data visualization |
| **Backend API** | FastAPI (Python), Uvicorn | REST API + WebSocket server |
| **Database** | SQLite (aiosqlite) / PostgreSQL (asyncpg) | Persistent state storage |
| **Authentication** | JWT (python-jose) + bcrypt | Token-based auth with password hashing |
| **OAuth** | Google OAuth 2.0 | Social sign-in |
| **LLM Providers** | OpenAI, Google Gemini, OpenRouter | Multi-provider AI inference |
| **Document Processing** | PyPDF2, python-docx, openpyxl | File upload and text extraction |
| **Real-Time** | WebSocket (FastAPI native) | Live simulation streaming and typing indicators |

### 3.2 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                       │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │  Login / │  │  Setup   │  │Simulation│  │  Report /  │   │
│  │Register │  │  Wizard  │  │  Live UI  │  │ Dashboard  │   │
│  └────┬────┘  └─────┬────┘  └─────┬─────┘  └──────┬─────┘   │
│       │  Auth Context (JWT)  │ WebSocket   │ REST API   │   │
└───────┼──────────────────────┼─────────────┼────────────┘   │
        │                      │             │               │
┌───────┼──────────────────────┼─────────────┼───────────────┐
│       ▼     FastAPI Backend  ▼             ▼               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Auth Router │ Simulation Router │ Document Router │   │
│  │   Agent Router │ WebSocket Router (Background)      │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │              Simulation Engine (Orchestrator)       │   │
│  ├──────────┬──────────┬──────────┬───────────────────┤   │
│  │ Agent 1  │ Agent 2  │ Agent N  │ Per-Agent LLM     │   │
│  │ (LLM)    │ (LLM)    │ (LLM)    │ Model Override    │   │
│  ├──────────┴──────────┴──────────┴───────────────────┤   │
│  │   Personality-Weighted State Machine               │   │
│  │   (Morale, Stress, Loyalty, Productivity)          │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ Decision Engine  │ World State  │ Round Agenda      │   │
│  │ (Hierarchy Vote) │ (Budget/Rep) │ (5 Phases)        │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ Hidden Agendas │ Random Events │ Agent Memory       │   │
│  └────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────┐   │
│  │  SQLite/PostgreSQL  │  Report Generator (LLM)     │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Feature Requirements

### 4.1 Authentication & User Management

#### FR-AUTH-01: Email/Password Registration
- **Priority:** High
- Users can register with email, name, and password (minimum 6 characters)
- Passwords are hashed using bcrypt before storage
- Upon registration, a JWT token is issued (7-day expiry)
- Duplicate email registration returns HTTP 409

#### FR-AUTH-02: Email/Password Login
- **Priority:** High
- Users authenticate with email and password
- Returns JWT token and user profile data
- Accounts created via Google OAuth are flagged and cannot use password login

#### FR-AUTH-03: Google OAuth 2.0
- **Priority:** High
- One-click sign-in with Google
- Supports both access token (OAuth2) and ID token (legacy) flows
- Automatically creates user accounts for new Google users
- Verifies token server-side via Google's userinfo/tokeninfo endpoints

#### FR-AUTH-04: Role-Based Access
- **Priority:** Medium
- Two roles: `user` (default) and `admin`
- Admin role assigned based on `ADMIN_EMAIL` environment variable
- Admin users have unlimited simulation credits

#### FR-AUTH-05: Credit System
- **Priority:** Medium
- New users receive **10 simulation credits**
- Each simulation launch consumes 1 credit
- Users with 0 credits receive HTTP 403 on simulation creation
- Admin users bypass credit checks

#### FR-AUTH-06: User Profile
- **Priority:** Medium
- `GET /api/auth/me` returns current user profile (id, email, name, avatar, role, credits)
- `GET /api/auth/me/simulations` returns all simulations owned by the user

---

### 4.2 Simulation Setup Wizard (3-Step Flow)

#### FR-SETUP-01: Company Profile Configuration (Step 1)
- **Priority:** High
- Input fields: Company Name (required, max 100 chars), Company Culture (required, max 1000 chars)
- Default values pre-filled for quick-start: "Pied Piper" / "A fast-paced tech startup..."

#### FR-SETUP-02: Crisis Injection (Step 1)
- **Priority:** High
- 4 pre-built crisis scenarios:
  - `rnd1` — Mandatory Weekend Coding for v2.0
  - `rnd2` — Budget Cut: 30% Layoffs Required
  - `rnd3` — CEO Resigns Unexpectedly
  - `rnd4` — Critical Database Deleted on Friday
- Custom crisis option with free-text input
- **AI Auto-Generate**: Button generates a tailored crisis using LLM based on company profile

#### FR-SETUP-03: AI Document Analysis (Step 1)
- **Priority:** Medium
- Upload documents (PDF, DOCX, DOC, TXT, CSV, XLSX, XLS) up to 10MB
- Drag-and-drop support
- AI extracts: summary, key requirements, team risks, suggested crisis, suggested agent roles, actionable insights
- One-click "Apply Suggestions" populates crisis and setup fields automatically

#### FR-SETUP-04: Team Assembly (Step 2)
- **Priority:** High
- Agent Pool: 4 preset agents fetched from `GET /api/agents/presets`
  - Alex (Tech Lead, Strict & Burned Out)
  - Sam (Junior Dev, Ambitious & Naive)
  - Jordan (Product Manager, Empathetic)
  - Casey (Senior Dev, Silent & Efficient)
- Click-to-add from pool to Active Roster
- Maximum roster size: **8 agents**
- Remove agents from roster with X button

#### FR-SETUP-05: Custom Agent Creation (Step 2)
- **Priority:** High
- Modal form with fields:
  - Name, Role, Type (personality label) — all required
  - Color (8 color options)
  - Motivation (optional, free-text)
  - Expertise (optional, free-text)
  - Per-Agent LLM Model (dropdown with 10 popular models + custom input)
  - 5 Personality Sliders (0–100 each):
    - Empathy, Ambition, Stress Tolerance, Agreeableness, Assertiveness
- Edit existing agents in roster via Pencil button
- Radar chart visualization of personality traits (expandable per agent)

#### FR-SETUP-06: Simulation Parameters (Step 3)
- **Priority:** High
- Duration: 1–24 weeks (slider, default: 12)
- Pacing Speed: Slow / Normal / Fast (determines delay between agent responses: 3s / 1.5s / 0.5s)
- Invoice Estimation: displays estimated API calls (agents × weeks) and cost

#### FR-SETUP-07: Launch Simulation
- **Priority:** High
- `POST /api/simulation/create` with full payload (company, agents, crisis, params)
- Authenticated users have credits deducted
- Redirects to `/simulation?id={sim_id}` on success

---

### 4.3 Simulation Engine (Core)

#### FR-SIM-01: Round-Based Execution
- **Priority:** Critical
- Simulation runs in discrete rounds (1 round = 1 simulated week)
- Each round, every non-resigned agent responds sequentially
- Responses are generated via LLM with full context injection

#### FR-SIM-02: Agent Response Generation
- **Priority:** Critical
- Each agent response includes:
  - `public_message` — What the agent says in the team meeting (1-3 sentences)
  - `internal_thought` — What the agent truly thinks but doesn't say
  - `state_changes` — Delta values for morale, stress, loyalty, productivity
  - `memory_update` — Key takeaway stored for future round context
  - `action` — Concrete action from the available actions list
  - `action_detail` — Description for `propose_solution` action type

#### FR-SIM-03: Personality-Weighted State Machine
- **Priority:** Critical
- State changes are modulated by personality traits:
  - **Stress Multiplier**: High stress tolerance = absorbs less stress (range 0.4x–1.6x)
  - **Morale Sensitivity**: High empathy + agreeableness = morale drops less from negativity
  - **Productivity Resilience**: High ambition = productivity drops less (range 0.5x–1.2x)
  - **Loyalty Stability**: High agreeableness + low assertiveness = loyalty changes less
- Natural recovery per round:
  - Stress recovery proportional to stress tolerance (0–4 pts/round)
  - Morale stabilization for empathetic agents below 50% morale
- Derived effects:
  - Stress > 80% → productivity penalty
  - Morale < 30% → loyalty penalty

#### FR-SIM-04: Critical Events Detection
- **Priority:** High
- **Resignation**: Triggered when morale ≤ threshold AND loyalty ≤ threshold (personality-adjusted)
  - Morale threshold: 10–15 (scaled by agreeableness)
  - Loyalty threshold: 15–25 (scaled by agreeableness)
- **Burnout**: Triggered when stress ≥ 90–95 (scaled by stress tolerance)
  - Causes immediate productivity penalty (7–15 pts)
- **Warning**: Morale within 12 points of resignation threshold
- All critical events are broadcast as system messages

#### FR-SIM-05: Communication DNA / Personality Voice System
- **Priority:** High
- LLM prompt includes a rich "Communication DNA" section derived from personality traits:
  - **Sentence Style**: Varies from commanding/declarative (high assertiveness) to tentative/qualifying (low assertiveness)
  - **Emotional Expression**: From openly emotional (high empathy) to emotionally flat (low empathy)
  - **Conflict Approach**: Confrontational, conflict-avoiding, diplomatic, or passive-aggressive
  - **Stress Behavior**: Frantic/catastrophizing to eerily calm, based on stress tolerance
  - **Ambition Signature**: Competitive/volunteering to content/minimal effort
  - **Example Phrases**: Lists of "would say" and "would never say" phrases

#### FR-SIM-06: Agent Memory System
- **Priority:** High
- Each agent stores memories per round (max 8, FIFO eviction)
- Memories are injected into the LLM prompt: "MEMORY: - Week X: [memory text]"
- Prompt instructs agents to reference and build upon previous discussions

#### FR-SIM-07: Per-Agent LLM Model Override
- **Priority:** Medium
- Each agent can use a different LLM model
- Auto-detection of provider from model string:
  - Contains `/` → OpenRouter (e.g., `anthropic/claude-3.7-sonnet`)
  - Starts with `gpt-`/`o1`/`o3` → OpenAI
  - Starts with `gemini` → Google Gemini
- Fallback: if per-agent model fails, retries with global provider

#### FR-SIM-08: Personality-Based Temperature
- **Priority:** Low
- LLM temperature is computed per-agent:
  - High empathy + agreeableness - assertiveness → higher temperature (more creative)
  - Range: 0.5–1.1

---

### 4.4 World State System

#### FR-WORLD-01: World State Tracking
- **Priority:** High
- Persistent per-simulation World State with metrics:
  - `deadline_remaining` (0–100%) — Ticks down each round
  - `budget_remaining` (0–100%) — Burns over time and via actions
  - `team_capacity` (0–100%) — Reduced by resignations
  - `customer_satisfaction` (0–100%) — Affected by events and actions
  - `technical_debt` (0–100%) — Accumulates without proactive management
  - `company_reputation` (0–100%) — Affected by crises and successful resolutions
  - `media_attention` (Low/Medium/High) — Escalates under certain conditions

#### FR-WORLD-02: World State Ticking
- **Priority:** High
- Each round, world state auto-updates:
  - Deadline approaches
  - Budget burns
  - Technical debt accumulates if not managed
- World state text is injected into every agent's LLM prompt for contextually-aware responses

#### FR-WORLD-03: Action-Consequence Coupling
- **Priority:** High
- Agent actions have direct impact on world state:
  - `propose_solution` / `support_proposal` → May improve metrics
  - `blame` / `escalate` → May worsen reputation or team capacity
  - `do_nothing` → Technical debt may increase
- Consequences are displayed as system messages

---

### 4.5 Decision Engine

#### FR-DEC-01: Proposal System
- **Priority:** High
- Agents can propose solutions via `propose_solution` action
- Proposals are tracked with: proposer, role, summary, supporters, opponents
- System message broadcast when a proposal is made

#### FR-DEC-02: Hierarchy-Weighted Voting
- **Priority:** High
- Each role has an influence weight (e.g., Tech Lead ≥ 2.0, Junior < 0.7)
- `weighted_support` = sum of supporter influence weights - opponent influence weights
- Decision threshold: weighted support ≥ 3.0
- Senior opposition generates system messages

#### FR-DEC-03: Decision Resolution
- **Priority:** High
- When a proposal reaches the weighted threshold → TEAM DECISION REACHED
- Decision is broadcast as a system message with supporter list and influence score
- Decision applies consequence to world state via `apply_decision_to_world()`

---

### 4.6 Round Agenda & Phases

#### FR-PHASE-01: 5-Phase Simulation Structure
- **Priority:** High
- Simulations follow a 5-phase narrative arc:
  1. **Crisis Shock** — Initial reaction to the crisis
  2. **Debate & Proposals** — Team discusses options
  3. **Escalation** — Tensions rise, decisions are forced
  4. **Resolution Attempt** — Actions are taken
  5. **Aftermath** — Final consequences and reflection
- Each phase has: name, description, tone, available actions, crisis-specific modifiers

#### FR-PHASE-02: Phase Transition Announcements
- **Priority:** Medium
- System message broadcast at each phase boundary: "📊 Phase Shift → [Phase Name]: [Description]"

---

### 4.7 Random Events

#### FR-EVENT-01: Random Event System
- **Priority:** Medium
- Random events can inject chaos at any round:
  - Client threats, positive press coverage, security breaches, investor calls, etc.
- Events include: name, description, `morale_effect`, `stress_effect`
- Effects are applied to all active agents using the personality-weighted state machine
- System message broadcast: "🎲 UNEXPECTED EVENT: [Name]\n[Description]"

---

### 4.8 Hidden Agendas

#### FR-HIDDEN-01: Secret Agent Motivations
- **Priority:** Medium
- Each agent has a hidden agenda invisible to the user
- Hidden agendas influence:
  - Which proposals agents support or oppose
  - Internal thoughts (but NOT public messages)
  - How agents argue and position themselves
- Injected into LLM prompt under a "SECRET" section with strict instructions not to reveal publicly

---

### 4.9 God Mode Interventions

#### FR-GOD-01: Real-Time Interventions
- **Priority:** High
- Users can inject interventions during active simulations:
  - 💰 **Bonus** — Boosts morale (+15), reduces stress (-5), increases loyalty (+10)
  - 🍕 **Pizza Party** — Moderate morale boost (+8), significant stress relief (-10)
  - 🎉 **Cancel Overtime** — Large morale boost (+20), major stress relief (-25), productivity penalty (-10)
  - 📢 **Custom** — User-defined intervention with moderate default effects
- Effect intensity modulated by agent agreeableness (cynical agents benefit less, range 0.5x–1.3x)
- Each intervention broadcasts a system announcement

---

### 4.10 Simulation Outcomes

#### FR-OUT-01: Outcome Determination
- **Priority:** High
- 6 possible simulation outcomes determined by final agent states + world state:
  - 🏆 **Team Triumph** — High morale, no resignations, decision made, healthy world
  - 🤝 **Negotiated Settlement** — Decision reached, acceptable morale
  - ⚡ **Pyrrhic Victory** — Resolution achieved but with casualties or world damage
  - 💔 **Team Fracture** — >50% resigned or avg morale < 20
  - 🔥 **Total Collapse** — All agents resigned
  - ⏳ **Stalemate** — No proposals made, time expired
- Outcome message includes final world state summary (budget, reputation, satisfaction, etc.)

---

### 4.11 Real-Time Interface

#### FR-RT-01: WebSocket Connection
- **Priority:** Critical
- WebSocket endpoint at `/ws/simulation/{sim_id}` for real-time streaming
- Supports multiple concurrent viewers per simulation
- Auto-reconnection handling

#### FR-RT-02: Live Message Streaming
- **Priority:** Critical
- All messages (public, thought, system) are streamed to connected clients in real-time
- Each message includes: id, round, agent_id, agent_name, type, content, thought, state_changes, timestamp

#### FR-RT-03: Typing Indicators
- **Priority:** Medium
- Before each agent's LLM call, a `typing_start` event is broadcast
- Shows which agent is currently "thinking" in the chat UI

#### FR-RT-04: Background Simulation Execution
- **Priority:** High
- Simulations run as background tasks via `asyncio.create_task`
- Clients can disconnect and reconnect without losing simulation progress
- Simulation state is persisted to database at every step

---

### 4.12 Post-Simulation Reports

#### FR-RPT-01: Report Generation
- **Priority:** High
- `GET /api/simulation/{sim_id}/report` generates a comprehensive report
- Report is generated using LLM (professional organizational psychologist persona)

#### FR-RPT-02: Report Contents
- **Priority:** High
- Report includes:
  - **Executive Summary** — 2-3 sentence overview
  - **Critical Finding** — Single most important insight
  - **Simulation Overview** — Objective, scenario, parameters
  - **Key Metrics** — Total agents, active, resignations, avg morale/stress/loyalty/productivity
  - **Analysis Insights** — 3-5 sentence analytical paragraph
  - **Conclusion** — Final verdict on team survival probability
  - **Agent Reports** — Per-agent breakdown (starting/ending morale, peak stress, status, status label)
  - **Recommendations** — 5 actionable recommendations
  - **Timeline** — Round-by-round metrics (morale, stress, output) for chart visualization

#### FR-RPT-03: Agent Classification
- **Priority:** Medium
- Each agent is classified post-simulation:
  - **Failed** — Resigned (with week number)
  - **Critical** — Survived but morale < 30%
  - **Stressed** — Survived but morale < 50%
  - **Stable** — Survived with moderate morale
  - **Thriving** — Survived with morale ≥ 70%

#### FR-RPT-04: Demo Report
- **Priority:** Low
- `GET /api/simulation/demo/report` returns a hardcoded demo report (Pied Piper scenario)
- Used for the "Live Demo Report" CTA on the landing page

---

### 4.13 Dashboard

#### FR-DASH-01: User Dashboard
- **Priority:** High
- Displays user profile (name, email, avatar, credits remaining)
- Lists all user simulations with status, company name, and creation date
- Quick-action button to create new simulation

---

### 4.14 Documentation

#### FR-DOCS-01: In-App Documentation
- **Priority:** Medium
- Full technical documentation available at `/docs`
- Sections: Overview, Quick Start, Architecture, Authentication, Core Concepts, Simulation Engine, Reports, API Reference
- Sidebar navigation with scroll-spy active section highlighting
- Mobile-friendly with floating navigation button
- Code blocks with copy functionality

---

## 5. Non-Functional Requirements

### 5.1 Performance
| Metric | Requirement |
|:---|:---|
| API Response Time | < 200ms for REST endpoints (excluding LLM calls) |
| WebSocket Latency | < 100ms for message delivery |
| LLM Response Time | 2-10s per agent response (model-dependent) |
| Concurrent Simulations | Support 10+ concurrent simulations |
| Database Queries | < 50ms for standard CRUD operations |

### 5.2 Scalability
- Stateless API design (simulation state cached in-memory + persisted to DB)
- Database connection pooling via asyncpg
- Per-agent LLM calls are sequential per simulation (to maintain conversation coherence)

### 5.3 Reliability
- Graceful LLM failure handling with multi-level fallback:
  1. Per-agent model → Global provider → Hardcoded fallback response
- Critical state persisted after every round
- WebSocket dead connection cleanup

### 5.4 Security
- JWT-based authentication with 7-day token expiry
- bcrypt password hashing (salt rounds auto-managed)
- CORS restricted to configured frontend URL
- Google OAuth token verification via server-side API calls
- File upload size limits (10MB) and extension whitelist

### 5.5 Accessibility
- Responsive design (mobile + desktop)
- Dark/light theme toggle
- Semantic HTML with proper heading hierarchy
- Keyboard-navigable UI components (shadcn/ui)

---

## 6. Data Models

### 6.1 Core Entities

#### PersonalityTraits
```json
{
  "empathy": 0-100,
  "ambition": 0-100,
  "stressTolerance": 0-100,
  "agreeableness": 0-100,
  "assertiveness": 0-100
}
```

#### AgentState
```json
{
  "morale": 0-100,
  "stress": 0-100,
  "loyalty": 0-100,
  "productivity": 0-100
}
```

#### AgentFullState (extends AgentConfig)
```json
{
  "id": "string",
  "name": "string",
  "role": "string",
  "type": "string",
  "personality": "PersonalityTraits",
  "color": "string (optional)",
  "motivation": "string (optional)",
  "expertise": "string (optional)",
  "model": "string (optional LLM model override)",
  "state": "AgentState",
  "initials": "string",
  "has_resigned": "boolean",
  "resigned_week": "int (optional)"
}
```

#### SimulationRequest
```json
{
  "company": { "name": "string", "culture": "string" },
  "agents": ["AgentConfig[]"],
  "crisis": { "scenario": "enum", "custom_description": "string (optional)" },
  "params": { "duration_weeks": 1-52, "pacing": "slow|normal|fast" }
}
```

### 6.2 Enumerations

| Enum | Values |
|:---|:---|
| SimulationStatus | `idle`, `running`, `paused`, `completed` |
| MessageType | `public`, `thought`, `system` |
| PacingSpeed | `slow`, `normal`, `fast` |
| InterventionType | `bonus`, `pizza`, `cancel_overtime`, `custom` |
| CrisisScenario | `rnd1`, `rnd2`, `rnd3`, `rnd4`, `custom` |

---

## 7. API Reference

### 7.1 Authentication Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register new user (email/password) |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/google` | Google OAuth authentication |
| `GET` | `/api/auth/me` | Get current user profile (requires auth) |
| `GET` | `/api/auth/me/simulations` | Get user's simulation history (requires auth) |

### 7.2 Simulation Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/simulation/create` | Create new simulation (optional auth, consumes credit) |
| `GET` | `/api/simulation/{sim_id}/status` | Get simulation state, agents, messages, metrics |
| `POST` | `/api/simulation/{sim_id}/intervene` | Send God Mode intervention |
| `GET` | `/api/simulation/{sim_id}/report` | Generate post-simulation report |
| `POST` | `/api/simulation/generate-crisis` | AI-generate a tailored crisis |

### 7.3 Agent Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/agents/presets` | Get preset agent configurations |

### 7.4 Document Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/document/analyze` | Upload and analyze a document with AI |

### 7.5 WebSocket Endpoints

| Endpoint | Description |
|:---|:---|
| `ws://host/ws/simulation/{sim_id}` | Real-time simulation updates |

### 7.6 System Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/health` | Backend health check |

---

## 8. Frontend Pages

| Route | Page | Description |
|:---|:---|:---|
| `/` | Landing Page | Hero section with interactive Pressure Level Simulator, feature cards, CTAs |
| `/login` | Login | Email/password + Google OAuth sign-in |
| `/register` | Register | New account creation |
| `/dashboard` | Dashboard | User profile, credits, simulation history |
| `/setup` | Setup Wizard | 3-step simulation configuration (Company → Team → Launch) |
| `/simulation?id={id}` | Live Simulation | Real-time Slack-like chat interface with God Mode controls |
| `/report?id={id}` | Report | Post-simulation executive report with charts and PDF export |
| `/docs` | Documentation | Full technical docs with sidebar navigation |

---

## 9. Environment Configuration

### 9.1 Required Environment Variables

```env
# LLM Configuration (at least one provider required)
LLM_PROVIDER=openai|gemini|openrouter
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AI...
OPENROUTER_API_KEY=sk-or-...

# Authentication
JWT_SECRET_KEY=your-secret-key
ADMIN_EMAIL=admin@example.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Application
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost/teamdynamics
```

### 9.2 Optional Configuration

```env
OPENAI_MODEL=gpt-4o-mini          # Default OpenAI model
GEMINI_MODEL=gemini-2.0-flash     # Default Gemini model
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

---

## 10. Quality Metrics & Success Criteria

| Metric | Target |
|:---|:---|
| Agent personality distinctiveness | Each agent should produce noticeably different speech patterns based on trait configuration |
| State change realism | Morale/stress changes should correlate logically with events and personality |
| Simulation completion rate | ≥ 95% of started simulations reach completion without errors |
| Report quality | Reports should contain specific, data-backed insights referencing agent names and weeks |
| Response validation rate | ≥ 98% of LLM responses pass structural validation without fallback |
| UI responsiveness | All pages render within 2s on standard hardware |

---

## 11. Known Limitations & Future Considerations

### 11.1 Current Limitations
- Agent responses are sequential per simulation (no parallel LLM calls) to maintain conversation coherence
- World state is in-memory per-simulation (lost on server restart; persisted agents/messages survive)
- Decision engine uses simple weighted threshold — no deliberation rounds
- No multi-simulation comparison or A/B testing interface
- File upload analysis is synchronous (may timeout for large documents)

### 11.2 Future Roadmap
- [ ] Parallel simulation execution for A/B testing
- [ ] Agent-to-agent direct messaging (private channels)
- [ ] Historical simulation replay
- [ ] Custom personality trait definitions (beyond the 5 defaults)
- [ ] Team template library (save and share configurations)
- [ ] Integration with real Slack/Teams for output distribution
- [ ] Subscription-based pricing with tiered credits
- [ ] Admin dashboard with user management

---

## 12. Glossary

| Term | Definition |
|:---|:---|
| **Agent** | An AI-driven virtual team member with personality traits, state, and memory |
| **Round** | One simulation tick representing one week of in-simulation time |
| **World State** | Global economic/operational constraints affecting all agents |
| **God Mode** | User-triggered interventions that affect all active agents |
| **Hidden Agenda** | Secret motivation assigned to an agent, invisible to the user |
| **Communication DNA** | LLM prompt section that maps personality traits to concrete speech patterns |
| **Decision Engine** | System that tracks proposals, hierarchy-weighted votes, and team consensus |
| **Personality-Weighted State Machine** | State update system where changes are modulated by individual personality traits |
| **Critical Event** | Resignation, burnout, or warning triggered by extreme agent state values |

---

*This document serves as the comprehensive product specification for TeamDynamics v1.0.*
