# TeamDynamics 

![TeamDynamics Gamified Dashboard](https://img.shields.io/badge/Status-Hackathon_Ready-green?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-16.2.2-black?style=flat-square&logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-blue?style=flat-square&logo=fastapi) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-blue?style=flat-square&logo=postgresql)

> What happens when you push your startup's smartest people too hard? Inject a crisis, redefine culture, and watch your AI-driven team react in real-time. Identify the exact breaking point of your startup before it happens in real life.

TeamDynamics is a **Multi-Agent Gamified SaaS Simulation** built specifically to analyze team morale, productivity drops, and communication breakdowns during corporate crises. 

---

## 🌟 Key Features (Hackathon Highlights)

- **Psychological Agent Personas**: Agents are equipped with complex personalities (Empathy, Ambition, Stress Tolerance, Agreeableness) driving their behavior during crunch times.
- **Strategic Decision Engine**: A robust world-state tracker with random events (e.g. server crashes, PR nightmares) and escalating phases.
- **Gamified Setup Wizard**: A smooth 3-step SaaS onboarding experience to design your mission context, drop-and-drag agent rosters, and set simulation speeds.
- **Live "Slack-like" Surveillance**: Watch the agents interact, rant, or quit in real-time via WebSocket connections. Agents have internal "thoughts" alongside public slack messages.
- **God-Mode Interventions**: Inject Pizza Parties, Cancel Overtime, or declare new crises on the fly and watch immediate morale shifts!
- **Data Analytics Output**: Timeline graphs charting Morale vs Productivity mapped across simulated weeks via a sleek Post-Simulation PDF Report.
- **Bring Your Own AI (BYO-AI)**: Seamless OpenRouter integration allows mixing top LLMs (Claude-3.7, GPT-4, Llama 3) across different team members. 

## 🏗 System Architecture

The project maintains a complete Full-Stack architecture:

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS4, `framer-motion` for buttery smooth transitions, `recharts` for timeline analytics, and `shadcn/ui`.
- **Backend API & Engine**: Python FastAPI, SQLModel + PostgreSQL (state persistence), `asyncio` for simulation processing.
- **AI Brains**: OpenRouter API proxy connecting multi-agent logic through Langchain/Pydantic structured parsers.
- **Real-Time Layer**: WebSocket endpoints pushing dynamic simulation ticks and typing indicators.

---

## 🚀 Quick Setup Guide

### 1. Backend Engine (FastAPI + PostgreSQL)

Inside your terminal, navigate to the `backend` folder and start the API:

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate    # macOS / Linux

# Install all dependencies from requirements.txt
pip install -r requirements.txt

# Create a .env file locally with:
# OPENROUTER_API_KEY=your_key_here
# DATABASE_URL=postgresql://user:pass@localhost/teamdynamics

# Run the backend locally
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> The API swagger documentation is available at: `http://localhost:8000/docs`

### 2. Frontend Interface (Next.js)

Open a second terminal, navigate to the `frontend` folder:

```bash
cd frontend

# Install UI Dependencies
npm install

# Run the dev server
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your browser. Launch into the dashboard, setup a team, trigger a crisis, and watch the chaos ensue!

---

*Built with passion, sweat, and lots of coffee for Hackathon Season 2.*
