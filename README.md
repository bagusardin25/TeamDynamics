<p align="center">
  <img src="frontend/public/logo.svg" alt="TeamDynamics Logo" width="80" />
</p>

<h1 align="center">TeamDynamics</h1>

<p align="center">
  <strong>See how a team breaks — before the stakes are real.</strong><br />
  <em>A living multi-agent AI crisis lab for people, decisions, and leadership.</em>
</p>

<p align="center">
  <a href="https://teamdynamics.vercel.app/demo"><img src="https://img.shields.io/badge/Launch_Live_Demo-6C63FF?style=for-the-badge&logo=vercel&logoColor=white" alt="Launch Live Demo" /></a>
  <a href="https://youtu.be/k7WHuGo-e30"><img src="https://img.shields.io/badge/Watch_Demo-FF0033?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch Demo" /></a>
  <a href="#running-the-project"><img src="https://img.shields.io/badge/Production_Ready-16A34A?style=for-the-badge" alt="Production Ready" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
</p>

<p align="center">
  <em>Hidden thoughts become visible. Decisions reshape the world. Every intervention leaves a trace.</em>
</p>

---

## 📖 Overview

TeamDynamics turns an invisible organizational risk into something you can
**see, measure, and safely challenge**. Build a psychologically distinct AI
team, inject a high-stakes company crisis, and watch morale, stress, loyalty,
alliances, decisions, and business metrics evolve together in real time.

Instead of asking a chatbot what *might* happen, TeamDynamics creates a living
system where every personality, vote, intervention, and consequence becomes
part of the outcome.

### ⚡ Judges' Fast Track

1. **[Launch the Northstar Labs crisis](https://teamdynamics.vercel.app/demo)** —
   no account, API key, or setup required.
2. **Watch three distinct agents collide** across public debate, private
   thoughts, shifting emotions, and team decisions.
3. **Open God Mode** to pause time, preview a targeted intervention, apply it,
   inspect its receipt, and safely undo it when eligible.
4. **Follow the consequences** into the world state and final executive outcome.

The public demo sends **18 deterministic messages from three agents across
three rounds** through the real simulation engine, state transitions,
persistence, WebSocket stream, decision tracking, and outcome generator —
without external model spend.

### Why It Stands Out

| Typical AI Demo | TeamDynamics |
|:---|:---|
| A single chatbot response | A society of agents with distinct psychology, memory, influence, and hidden intent |
| A scripted conversation | A stateful crisis where dialogue, team health, and company metrics affect one another |
| A magic action button | Previewed, scoped, confirmable interventions with receipts and safe undo |
| A static result | A live decision journey ending in an executive-grade diagnosis |

---

## What We Added During OpenAI Build Week

TeamDynamics entered OpenAI Build Week with an existing multi-agent simulation
foundation. During the event, the project was extended into a clearer,
judge-ready end-to-end experience:

- A public, rate-limited Quick Demo that requires no account or API key
- A deterministic three-agent demo story that still runs through the real
  simulation engine, persistence, WebSocket stream, decisions, and outcomes
- Document-assisted setup that extracts grounded company context, risks,
  crisis suggestions, and agent recommendations from uploaded files
- God Mode interventions with preview, scoped targets, confirmation, auditable
  receipts, and safe undo behavior
- More readable live conversations, structured events, and clearer report
  metrics so users can follow cause and effect
- Reliability improvements for aborted simulations, malformed agent output,
  agent identity validation, and report generation
- A more polished judge path across the landing page, guided setup, simulation,
  intervention workflow, and final executive report

These additions preserve the original Premeditatio Malorum-inspired idea while
making the complete decision-rehearsal journey easier to experience and
evaluate.

## How We Used GPT-5.6

GPT-5.6 was used as a **development reasoning model through OpenAI Codex**, not
as TeamDynamics' deployed inference API. The application's current default
OpenAI runtime model remains **`gpt-4o-mini`**, while the public Quick Demo uses
deterministic responses to provide a reliable, zero-key judge experience.

Within Codex, GPT-5.6 helped reason across the full stack: tracing simulation
state, reviewing agent and report behavior, identifying reliability and
security risks, refining user flows, and checking whether frontend presentation
matched backend behavior. This continued an earlier development path that used
GPT-5.4 and GPT-5.5 before moving to GPT-5.6.

## How We Used OpenAI Codex

Codex was used throughout TeamDynamics as an agentic engineering collaborator,
not only as code completion. It helped to:

- Explore and audit the existing Next.js, FastAPI, PostgreSQL, and WebSocket
  architecture before making changes
- Turn product requirements into scoped implementations across the setup,
  simulation, intervention, and report flows
- Trace failures across frontend and backend boundaries and implement focused
  fixes
- Run linting, type checks, unit tests, backend tests, and build verification
- Review reliability, security, documentation, and judge-facing clarity
- Work with TestSprite evidence in a build-test-inspect-fix-verify loop

TestSprite exercised real product journeys and exposed behavioral failures;
Codex helped inspect those failures, identify root causes, implement fixes, and
verify the affected flows again. Product direction, architecture, trade-offs,
and final validation remained human-owned.

---

## ✨ Key Features

### 🧠 Psychological Agent Personas
Each agent is equipped with a **5-trait personality system** (Empathy, Ambition, Stress Tolerance, Agreeableness, Assertiveness) that drives unique speech patterns, decision-making, and stress responses — no generic chatbot behavior.

### ⚡ Real-Time Simulation Engine
Watch agents interact in a **Slack-like surveillance interface** via WebSocket connections. See public messages alongside hidden internal thoughts, with typing indicators and system event broadcasts.

### 🎮 God-Mode Interventions
Change the simulation without losing control. The backend-authoritative **Observe / Intervene** console can target the whole team, one agent, the project, or the decision process. Preview deterministic impact before applying, confirm high-impact actions, inspect an auditable receipt, and safely undo eligible changes. The console starts collapsed on desktop and mobile so the agents remain center stage.

### 🌍 Dynamic World State
A persistent **economic simulation layer** tracks budget, reputation, customer satisfaction, technical debt, and deadline pressure — making every agent decision consequential.

### 🗳️ Hierarchy-Weighted Decision Engine
Proposals are voted on with **influence weights based on role seniority**. Senior roles carry more weight, mirroring real corporate power dynamics.

### 📄 AI Document Analysis
Upload company documents (PDF, DOCX, CSV, XLSX) and let AI **extract team risks, suggest crises, and auto-fill simulation parameters**.

### 📊 Executive Reports
Post-simulation **AI-generated reports** with agent-by-agent analysis, timeline charts, survival classifications, and actionable recommendations — exportable as PDF.

### 🔀 BYO-AI (Bring Your Own AI)
Mix and match **LLM providers** (OpenAI, Google Gemini, OpenRouter) per-agent for behavioral diversity. Supports Claude, GPT-4, Llama 3, and more.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 Frontend                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │  Login /  │  │  Setup   │  │Simulation │  │  Report /    │  │
│  │ Register  │  │  Wizard  │  │  Live UI   │  │  Dashboard   │  │
│  └─────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│        │    JWT Auth   │  WebSocket   │   REST API    │         │
└────────┼───────────────┼─────────────┼───────────────┼─────────┘
         │               │             │               │
┌────────┼───────────────┼─────────────┼───────────────┼─────────┐
│        ▼    FastAPI Backend          ▼               ▼         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Auth Router │ Simulation Router │ Document │ WebSocket  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │             Simulation Engine (Orchestrator)              │  │
│  ├──────────┬──────────┬──────────┬─────────────────────────┤  │
│  │ Agent 1  │ Agent 2  │ Agent N  │  Per-Agent LLM Model    │  │
│  │  (LLM)   │  (LLM)   │  (LLM)   │  Override Support      │  │
│  ├──────────┴──────────┴──────────┴─────────────────────────┤  │
│  │ Personality-Weighted State Machine  │  Communication DNA  │  │
│  ├─────────────────────────────────────┴────────────────────┤  │
│  │ Decision Engine │ World State │ Phase System │ Memory    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Hidden Agendas  │  Random Events  │  Report Generator    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  PostgreSQL Database                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|:---|:---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Charts** | Recharts |
| **Backend** | Python, FastAPI, Uvicorn |
| **Database** | PostgreSQL (asyncpg) |
| **Auth** | JWT (python-jose) + bcrypt, Google OAuth 2.0 |
| **AI Providers** | OpenAI, Google Gemini, OpenRouter |
| **Documents** | PyPDF2, python-docx, openpyxl |
| **Real-Time** | WebSocket (FastAPI native) |

---

## Running the Project

The fastest way to evaluate TeamDynamics is the
**[public Quick Demo](https://teamdynamics.vercel.app/demo)**. It requires no
account, API key, or local setup.

For local development, follow the steps below.

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+
- **Git**
- At least one LLM API key (OpenAI, Gemini, or OpenRouter)

### 1. Clone the Repository

```bash
git clone https://github.com/bagusardin25/TeamDynamics.git
cd TeamDynamics
```

### 2. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see Environment Variables below)

# Start the backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> **📝 API Docs:** Swagger UI available at [https://teamdynamics.vercel.app/docs](https://teamdynamics.vercel.app/docs)

### 3. Frontend Setup (Next.js)

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Launch

Navigate to [https://teamdynamics.vercel.app](https://teamdynamics.vercel.app) — create an account, set up a team, trigger a crisis, and watch the chaos unfold!

---

## Testing Instructions

### Backend Tests

From the repository root:

```bash
cd backend
python -m pip install pytest
python -m pytest -q
```

The backend suite covers the demo engine and endpoint, simulation events,
WebSocket completion behavior, document analysis, interventions, report
generation, agent identity validation, and LLM-provider behavior. Model calls
are mocked in focused tests, so the suite does not require spending API credit.

### Frontend Quality Gates

```bash
cd frontend
npm install
npm run lint
npm run test:unit
npx tsc --noEmit
npm run build
```

The committed unit-test command covers the public demo API contract and
simulation labels. Linting, TypeScript checking, and the production build catch
broader integration and rendering regressions.

### TestSprite End-to-End Evidence

TeamDynamics was iteratively tested with TestSprite from early development.
Generated plans, browser tests, and the HTML report are preserved under
[`testsprite_tests/`](testsprite_tests/), including 35 named product journeys.

To replay a safe, unauthenticated local browser flow after starting both the
backend and frontend:

```bash
python -m pip install playwright
python -m playwright install chromium
python testsprite_tests/TC012_Redirect_to_login_when_visiting_dashboard_unauthenticated.py
```

Some generated scenarios exercise registration or authenticated data. Review a
test file before replaying it and use dedicated test credentials rather than a
personal or production account.

---

## ⚙️ Environment Variables

Create a `.env` file inside `/backend` based on `.env.example`:

```env
# ─── LLM Provider (required — at least one) ───
LLM_PROVIDER=openai                    # openai | gemini | openrouter
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini              # cost-conscious default with Structured Outputs
OPENAI_CHEAP_MODEL=gpt-4o-mini        # used during traffic/cost spikes
GEMINI_API_KEY=AI...
GEMINI_MODEL=gemini-2.0-flash         # optional, default model
GEMINI_CHEAP_MODEL=gemini-2.0-flash
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_DEFAULT_MODEL=openrouter/free
OPENROUTER_CHEAP_MODEL=openrouter/free
LLM_DAILY_BUDGET_USD=0.25             # local daily safety cap; adjust deliberately
LLM_FALLBACK_ENABLED=true
LLM_FALLBACK_BUDGET_THRESHOLD_PCT=80
LLM_TRAFFIC_SPIKE_ACTIVE_CALLS=10

# ─── Server ───
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=https://teamdynamics.vercel.app
ENVIRONMENT=production
FORCE_HTTPS=true

# ─── Authentication ───
JWT_SECRET_KEY=<output-of-openssl-rand-hex-32>
ADMIN_EMAIL=admin@example.com          # gets unlimited credits

# Error Tracking
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production

# ─── Database ───
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teamdynamics

# ─── Google OAuth (optional) ───
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Frontend analytics is optional. Set these in the frontend deployment when using PostHog:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

> **Note:** `DATABASE_URL` must point to a PostgreSQL database in local and production environments. In production, `JWT_SECRET_KEY` must be a strong random value with at least 32 characters or the backend will refuse to start.

### Production Monitoring

Configure an external uptime monitor such as UptimeRobot or Better Stack to check `GET /health` every 1-5 minutes. Alert on non-2xx responses and latency spikes. Sentry covers application errors, while PostHog covers product analytics.

---

## 📂 Project Structure

```
TeamDynamics/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment template
│   ├── models/
│   │   └── database.py            # DB init, schemas, connection pooling
│   ├── routers/
│   │   ├── auth.py                # Auth endpoints (register, login, OAuth)
│   │   ├── simulation.py          # Simulation CRUD & intervention endpoints
│   │   ├── agents.py              # Preset agent configurations
│   │   ├── document.py            # Document upload & AI analysis
│   │   └── websocket.py           # WebSocket real-time streaming
│   └── services/
│       ├── auth_service.py        # JWT, password hashing, Google OAuth
│       ├── interventions.py       # Preview, apply, receipt, and safe-undo rules
│       ├── simulation_engine.py   # Core simulation orchestrator
│       ├── llm_service.py         # Multi-provider LLM integration
│       ├── decision_engine.py     # Proposal system & hierarchy voting
│       ├── document_service.py    # File parsing & AI extraction
│       └── report_generator.py    # Post-simulation report generation
│
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── logo.svg               # Application logo
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # Landing page
│       │   ├── login/              # Authentication — login
│       │   ├── register/           # Authentication — register
│       │   ├── dashboard/          # User dashboard & simulation history
│       │   ├── setup/              # 3-step simulation setup wizard
│       │   ├── simulation/         # Live simulation interface
│       │   ├── report/             # Post-simulation executive report
│       │   └── docs/               # In-app technical documentation
│       └── components/
│           ├── simulation/         # Simulation UI components
│           │   ├── MessageFeed.tsx
│           │   ├── MessageBubble.tsx
│           │   ├── AgentSidebar.tsx
│           │   ├── MetricsDashboard.tsx
│           │   ├── InterventionPanel.tsx
│           │   ├── RadialGauge.tsx
│           │   └── ...
│           └── ui/                 # shadcn/ui components
│
└── README.md
```

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/auth/register` | Register with email/password |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/google` | Google OAuth sign-in |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/auth/me/simulations` | Get user's simulation history |

### Simulation

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/simulation/create` | Create & launch a new simulation |
| `GET` | `/api/simulation/{id}/status` | Get simulation state & messages |
| `POST` | `/api/simulation/{id}/interventions/preview` | Preview a scoped intervention |
| `POST` | `/api/simulation/{id}/intervene` | Apply a previewed God-Mode intervention |
| `POST` | `/api/simulation/{id}/interventions/{intervention_id}/undo` | Safely undo the latest eligible intervention |
| `POST` | `/api/simulation/{id}/control` | Pause, resume, or step one agent turn |
| `GET` | `/api/simulation/{id}/report` | Generate executive report |
| `POST` | `/api/simulation/generate-crisis` | AI-generate a crisis scenario |

### Other

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/agents/presets` | Get preset agent configurations |
| `POST` | `/api/document/analyze` | Upload & analyze document with AI |
| `WS` | `/ws/simulation/{id}` | WebSocket: real-time simulation stream |
| `GET` | `/health` | Backend health check |

---

## 🎮 How It Works

```
   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  1. SETUP │───▶│ 2. CRISIS│───▶│ 3. LIVE  │───▶│ 4. REPORT│
   │  Team &   │    │  Inject  │    │  Observe │    │  Analyze │
   │  Company  │    │  Scenario│    │  & Act   │    │  Results │
   └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

1. **Setup** — Configure your company profile, assemble a team (4-8 agents) with custom personalities, and choose simulation parameters.
2. **Crisis Injection** — Select a pre-built crisis (layoffs, CEO resignation, database wipe) or let AI generate one from uploaded documents.
3. **Live Simulation** — Watch agents debate, propose solutions, burn out, or resign in real-time. Open the collapsed God Mode console only when needed to pause, preview, apply, audit, or safely undo a scoped intervention.
4. **Report** — Receive an AI-generated executive report with per-agent analysis, morale/stress timelines, survival classifications, and actionable recommendations.

### Simulation Engine Details

- **5-Phase Narrative Arc:** Crisis Shock → Debate & Proposals → Escalation → Resolution Attempt → Aftermath
- **Personality-Weighted State Machine:** Morale, stress, loyalty, and productivity changes are modulated by each agent's unique personality traits
- **Hidden Agendas:** Agents have secret motivations that subtly influence their proposals and alliances
- **Random Events:** Unexpected events (client threats, security breaches, investor calls) inject chaos into the simulation
- **Critical Events:** Resignation, burnout, and warning detection based on personality-adjusted thresholds
- **6 Possible Outcomes:** Team Triumph 🏆 | Negotiated Settlement 🤝 | Pyrrhic Victory ⚡ | Team Fracture 💔 | Total Collapse 🔥 | Stalemate ⏳

---

## 🌐 Live Demo

> **Frontend:** [https://teamdynamics.vercel.app](https://teamdynamics.vercel.app)
> **Backend API:** Hosted on Railway

---

## 🎬 Demo Video

> 📺 **[Watch the Demo on YouTube](https://youtu.be/k7WHuGo-e30)**

---

## 🛣️ Roadmap

- [ ] Parallel simulation execution for A/B testing
- [ ] Agent-to-agent private messaging channels
- [ ] Historical simulation replay
- [ ] Custom personality trait definitions
- [ ] Team template library (save & share configurations)
- [ ] Slack / Teams integration for output distribution
- [ ] Subscription-based pricing with tiered credits
- [ ] Admin dashboard with user management

---

## 📄 License

This project is proprietary. All rights reserved.

---

<p align="center">
  <em>Built for leaders who would rather simulate the crisis than survive it.</em>
</p>
