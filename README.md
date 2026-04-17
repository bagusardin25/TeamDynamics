<p align="center">
  <img src="frontend/public/logo.svg" alt="TeamDynamics Logo" width="80" />
</p>

<h1 align="center">TeamDynamics</h1>

<p align="center">
  <strong>Multi-Agent Gamified SaaS Simulation for Team Crisis Analysis</strong>
</p>

<p align="center">
  <a href="#-quick-start"><img src="https://img.shields.io/badge/Status-Production_Ready-brightgreen?style=for-the-badge" alt="Status" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/SQLite%20%7C%20PostgreSQL-Ready-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database" />
</p>

<p align="center">
  <em>Identify the exact breaking point of your startup before it happens in real life.</em>
</p>

---

## 📖 Overview

TeamDynamics is a **multi-agent AI-powered simulation platform** that lets startup founders, HR leaders, and team managers stress-test their team's resilience under corporate crises. Assemble a virtual team of psychologically-profiled AI agents, inject a real-world crisis scenario, and observe in real-time how your team reacts — predicting burnout cascades, communication breakdowns, and resignation waves before they happen.

### Why TeamDynamics?

| Challenge | How TeamDynamics Solves It |
|:---|:---|
| **Unpredictable team reactions** | Personality-weighted AI agents produce realistic, differentiated behavior |
| **Costly trial-and-error** | Simulate weeks of crisis in minutes with zero real-world risk |
| **Hidden team fracture points** | Expose breaking points through morale, stress, and loyalty tracking |
| **One-size-fits-all management** | Test different interventions (bonuses, overtime cancellation, etc.) and compare outcomes |

---

## ✨ Key Features

### 🧠 Psychological Agent Personas
Each agent is equipped with a **5-trait personality system** (Empathy, Ambition, Stress Tolerance, Agreeableness, Assertiveness) that drives unique speech patterns, decision-making, and stress responses — no generic chatbot behavior.

### ⚡ Real-Time Simulation Engine
Watch agents interact in a **Slack-like surveillance interface** via WebSocket connections. See public messages alongside hidden internal thoughts, with typing indicators and system event broadcasts.

### 🎮 God-Mode Interventions
Inject **Pizza Parties**, **Cancel Overtime**, **Bonuses**, or declare new crises on-the-fly. Watch immediate morale shifts with effects modulated by each agent's personality.

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
│  │          SQLite (dev) / PostgreSQL (prod)                │  │
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
| **Database** | SQLite (aiosqlite) / PostgreSQL (asyncpg) |
| **Auth** | JWT (python-jose) + bcrypt, Google OAuth 2.0 |
| **AI Providers** | OpenAI, Google Gemini, OpenRouter |
| **Documents** | PyPDF2, python-docx, openpyxl |
| **Real-Time** | WebSocket (FastAPI native) |

---

## 🚀 Quick Start

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

> **📝 API Docs:** Swagger UI available at [http://localhost:8000/docs](http://localhost:8000/docs)

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

Navigate to [http://localhost:3000](http://localhost:3000) — create an account, set up a team, trigger a crisis, and watch the chaos unfold!

---

## ⚙️ Environment Variables

Create a `.env` file inside `/backend` based on `.env.example`:

```env
# ─── LLM Provider (required — at least one) ───
LLM_PROVIDER=openai                    # openai | gemini | openrouter
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini              # optional, default model
GEMINI_API_KEY=AI...
GEMINI_MODEL=gemini-2.0-flash         # optional, default model
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_DEFAULT_MODEL=meta-llama/llama-3.1-8b-instruct:free

# ─── Server ───
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# ─── Authentication ───
JWT_SECRET_KEY=your-secret-key         # change this in production
ADMIN_EMAIL=admin@example.com          # gets unlimited credits

# ─── Database ───
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/teamdynamics

# ─── Google OAuth (optional) ───
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Note:** If no `DATABASE_URL` is set, the backend falls back to **SQLite** (`teamdynamics.db`) for development.

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
| `POST` | `/api/simulation/{id}/intervene` | Send God-Mode intervention |
| `GET` | `/api/simulation/{id}/report` | Generate executive report |
| `POST` | `/api/simulation/generate-crisis` | AI-generate a crisis scenario |
| `GET` | `/api/simulation/demo/report` | Demo report (no auth required) |

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
3. **Live Simulation** — Watch agents debate, propose solutions, burn out, or resign in real-time. Use God-Mode to intervene with bonuses, pizza parties, or overtime cancellation.
4. **Report** — Receive an AI-generated executive report with per-agent analysis, morale/stress timelines, survival classifications, and actionable recommendations.

### Simulation Engine Details

- **5-Phase Narrative Arc:** Crisis Shock → Debate & Proposals → Escalation → Resolution Attempt → Aftermath
- **Personality-Weighted State Machine:** Morale, stress, loyalty, and productivity changes are modulated by each agent's unique personality traits
- **Hidden Agendas:** Agents have secret motivations that subtly influence their proposals and alliances
- **Random Events:** Unexpected events (client threats, security breaches, investor calls) inject chaos into the simulation
- **Critical Events:** Resignation, burnout, and warning detection based on personality-adjusted thresholds
- **6 Possible Outcomes:** Team Triumph 🏆 | Negotiated Settlement 🤝 | Pyrrhic Victory ⚡ | Team Fracture 💔 | Total Collapse 🔥 | Stalemate ⏳

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
  <em>Built with passion, caffeine, and a whole lot of AI for Hackathon Season 2.</em>
</p>
