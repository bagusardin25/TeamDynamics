# Creator Skill Generator

Creator Skill Generator turns creator content into reusable AI skills.

It analyzes material from Twitter/X, YouTube, or personal writing, identifies the recurring tone, structure, and constraints behind that content, and converts those patterns into portable `SKILL.md`-centered bundles that can be used in tools like Codex and Claude Code.

Creators can generate multiple skills for different writing styles and reuse the right one without re-explaining the voice every time.

I built this after running into the same problem during content creation: getting AI to sound consistent meant rewriting the same style instructions again and again until the tone finally matched. This project was built for the hackathon to replace that repeated prompting with reusable creator skills that can be generated once and reused across sessions.

To make sure the backend workflows behaved reliably, I used TestSprite to test the API flows and catch errors, edge cases, and integration issues during development. That feedback loop helped harden the generation pipeline and improve endpoint reliability.

## Demo

- Live Demo: [creator-skill-generator.vercel.app](https://creator-skill-generator.vercel.app)
- Demo Video: [YouTube walkthrough](https://youtu.be/VQdmyS9Zhng)

## Repository Overview

This repository includes:

- a unified FastAPI backend in [`backend/`](backend/)
- two earlier backend snapshots in [`backend/workflow-1/`](backend/workflow-1/) and [`backend/workflow-2/`](backend/workflow-2/)
- a full Next.js website in [`website/`](website/)

The website and backend now work together as one product: the frontend handles the live generation experience, and the backend produces the reusable skill bundles.

## What A Skill Is

Agent Skills are a lightweight open format for extending agent capabilities with specialized workflows and knowledge.

At minimum, a skill is a directory with a `SKILL.md` file. That file contains YAML frontmatter plus markdown instructions. Skills can also include:

- `scripts/` for executable helpers
- `references/` for documentation loaded on demand
- `assets/` for templates or resources
- `agents/openai.yaml` as optional Codex-oriented UI and dependency metadata

This is the model used by Agent Skills and supported by both Codex and Claude Code.

## How Skills Work

Skills use progressive disclosure:

1. At startup, the agent reads only metadata such as `name` and `description`.
2. When a task matches the skill, the agent loads the full `SKILL.md`.
3. When needed, the agent loads supporting files from `scripts/`, `references/`, or `assets/`.

That is why good skills keep the main `SKILL.md` focused and move bulky detail into references.

## Why This Project Exists

Random prompting works for one-off content tasks, but it breaks down when the same creator workflow has to be repeated over and over.

The usual pattern looks like this:

- paste a long prompt
- explain the creator's tone again
- explain the structure again
- explain what to avoid again
- hope the model stays consistent

That is slow, inconsistent, and hard to reuse across sessions.

Creator Skill Generator exists to turn that repeated prompting into a reusable skill package. Instead of rewriting the same context every time, the user builds one grounded skill from a creator corpus and reuses it across future tasks.

## Example User Flow

A practical user flow for this project looks like this:

1. A user gathers source material from a creator:
   pasted scripts, Twitter/X posts, or YouTube transcripts.
2. The backend analyzes that corpus and extracts recurring patterns:
   structure, tone, workflows, constraints, and examples.
3. The app generates a portable skill bundle:
   `SKILL.md`, supporting `references/`, and optional `agents/openai.yaml`.
4. The user reviews the output and exports the bundle.
5. The user installs or copies the generated skill into Codex or Claude Code.
6. Later, instead of writing a long prompt from scratch, the user activates the skill and gives only the task-specific input.

That changes the workflow from "describe everything every time" to "reuse a grounded skill, then give only the current assignment."

## Why Skills Beat Random Prompting For Content Creation

For this project's use case, skills are better than repeated random prompts because they preserve the important parts of the workflow:

- the role or job stays stable
- the constraints stay stable
- the output format stays stable
- the long-form source material can live in `references/`
- the main `SKILL.md` stays concise enough for progressive disclosure
- the result can be reused across sessions, projects, and tools

This is especially useful for creator workflows, where quality usually depends on consistent structure and constraints rather than a clever one-time prompt.

## What This Project Does Today

The current project is centered on a unified FastAPI backend that can:

- generate a skill from pasted creator content
- generate a skill from a Twitter/X username
- generate a skill from YouTube video transcripts
- return the generated files directly in the API response
- persist generated bundles under `generated_skills/`
- create zip exports
- list, fetch, export, and delete generated skills

The generated bundle is centered around:

- `SKILL.md`
- supporting `references/`
- optional `agents/openai.yaml`
- a portable folder or zip export

The repository also includes a finished Next.js frontend that connects to the backend, guides users through generation, and supports bundle review and export flows.

## Built-In Skill Creators Vs This Project

Both ecosystems provide a way to create skills:

- Codex includes a built-in `$skill-creator`
- Anthropic provides official skill-creation guidance and an official `skill-creator` skill in the Anthropic skills ecosystem

Those tools are good for creating a skill from a human description.

Creator Skill Generator is more accurate for **source-derived skill generation** because it does not start from a blank idea. It starts from actual source material and grounds the generated skill in evidence:

- pasted creator text
- Twitter/X content
- YouTube transcripts

That makes it stronger for this specific use case because it can:

- extract repeatable patterns from real source material
- infer tighter constraints from the content itself
- build reference files from the underlying corpus
- keep `SKILL.md` shorter and push bulk material into `references/`
- generate a reusable exported bundle instead of only scaffolding a template

So the correct comparison is not "better than every built-in creator in all cases." The correct claim is:

**For turning an existing creator corpus into a grounded skill package, this project is more accurate and more automated than a generic skill scaffold.**

## How Codex And Claude Code Use Skills

Both Codex and Claude Code support skills as discoverable, activatable workflow packages.

Codex supports:

- implicit activation based on description matching
- explicit activation through skill mentions and skill selectors
- optional `agents/openai.yaml` metadata

Claude Code supports:

- implicit activation when a request matches the description
- explicit activation through `/skill-name`
- supporting files, invocation controls, arguments, and subagent patterns

For this project, the important point is simple: both tools can consume a well-structured `SKILL.md` package.

## Why The Generated Shape Matters

This repository already generates the shape that skills-compatible tools expect:

- `SKILL.md` as the entrypoint
- reference files for progressive disclosure
- optional scripts or metadata
- a portable folder / zip artifact

That makes the generated output practical to review, version, and reuse.

## Main Repository Components

### 1. Unified Backend

The primary backend lives in [`backend/`](backend/).

It exposes two versioned workflows:

- `v1` for raw pasted content
- `v2` for raw content plus Twitter/X and YouTube ingestion

This is the current main implementation and the one to treat as the active app backend.

### 2. Workflow 1 Snapshot

[`backend/workflow-1/`](backend/workflow-1/) is the earlier raw-paste-only backend.

It is useful for:

- understanding the first generation flow
- seeing the minimal API surface
- reviewing the earliest TestSprite coverage

It is now a reference snapshot, not the main server.

### 3. Workflow 2 Snapshot

[`backend/workflow-2/`](backend/workflow-2/) extends the earlier workflow with:

- Twitter/X ingestion
- YouTube transcript ingestion

It is also a reference snapshot now. Its functionality has been merged into the unified backend.

### 4. Website

[`website/`](website/) is the Next.js frontend for the project.

It now includes:

- the marketing site and product narrative
- backend-connected generation flows
- bundle preview and export interactions
- the live demo experience deployed on Vercel

## Generated Skill Package Shape

The generated output is designed around the Agent Skills idea of a folder with a `SKILL.md` entrypoint.

A typical persisted bundle looks like:

```text
generated_skills/
└── some-skill/
    ├── SKILL.md
    ├── references/
    │   ├── framework.md
    │   ├── examples.md
    │   └── sources.md
    └── agents/
        └── openai.yaml
```

There may also be a zip archive:

```text
generated_skills/some-skill.zip
```

Important notes:

- `SKILL.md` is the main artifact
- `references/` holds supporting material
- `agents/openai.yaml` is an optional Codex-oriented companion file generated by this project
- the final bundle is meant to stay compatible with progressive disclosure patterns

The reason this structure matters is that both the Agent Skills spec and Anthropic's authoring guidance recommend keeping the core skill focused and pushing the bulk of the material into reference files. This repository's generated shape follows that direction.

## Spec Alignment

The generated bundles are intended to align with the core Agent Skills spec:

- `name` should be lowercase, hyphenated, and match the parent directory
- `name` should stay within 64 characters
- `description` should explain both what the skill does and when to use it
- `description` should stay within 1024 characters
- optional directories such as `scripts/`, `references/`, and `assets/` can be added as needed
- optional fields such as `compatibility`, `metadata`, and `allowed-tools` exist in the spec, though this project currently focuses on the core required fields plus `agents/openai.yaml`

## Skill Design Principles Backed By Current Docs

After checking OpenAI, Anthropic, Agent Skills, and the official skill repositories, the most reliable guidance for this project is:

- a skill should target one clear repeatable job
- the frontmatter `description` is the primary trigger signal and should explain both what the skill does and when to use it
- `SKILL.md` should stay focused as the entrypoint
- bulk guidance should move into `references/`
- examples, constraints, and explicit output formats are more useful than generic prose
- `SKILL.md` should stay under roughly 500 lines, with larger material split into referenced files
- file references should stay shallow and one level deep from `SKILL.md`

One useful community shorthand is that a prompt is a request while a skill is closer to a reusable job description. That is directionally right, but the spec-level guidance is more concrete: specific descriptions, progressive disclosure, and portable bundle structure.

## How Generation Works

The generation pipeline is:

1. Input arrives as pasted text or source identifiers.
2. The backend normalizes that into creator content.
3. CrewAI-based generation runs through analysis and writing steps.
4. The output skill name is normalized into a slug.
5. Generated files are post-processed.
6. Soft validation warnings are produced.
7. Files can be persisted under `generated_skills/`.
8. A zip archive can also be created.
9. The API returns files, warnings, metadata, and paths.

The main backend logic lives in:

- [`backend/main.py`](backend/main.py)
- [`backend/app/service.py`](backend/app/service.py)
- [`backend/app/crew.py`](backend/app/crew.py)
- [`backend/app/storage.py`](backend/app/storage.py)

## Where TestSprite Is Located

There are three relevant TestSprite folders in this repository.

### Current Main TestSprite Suite

The active TestSprite output for the unified backend is:

- [`backend/testsprite_tests/`](backend/testsprite_tests/)

This is the most important one.

It contains:

- generated test cases such as `TC001_...py`
- `testsprite_backend_test_plan.json`
- `standard_prd.json`
- `testsprite-mcp-test-report.md`
- `testsprite-mcp-test-report.html`
- temporary execution artifacts under `tmp/`

### Workflow 1 TestSprite Suite

The raw-paste prototype has its own historical suite:

- [`backend/workflow-1/testsprite_tests/`](backend/workflow-1/testsprite_tests/)

### Workflow 2 TestSprite Suite

The extended Twitter/YouTube prototype has its own historical suite:

- [`backend/workflow-2/testsprite_tests/`](backend/workflow-2/testsprite_tests/)

## Repository Structure

```text
.
├── README.md
├── backend/
│   ├── main.py
│   ├── app/
│   ├── generated_skills/
│   ├── testsprite_tests/
│   ├── workflow-1/
│   ├── workflow-2/
│   ├── README.md
│   └── PRD.md
└── website/
    ├── src/
    ├── public/
    └── README.md
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
uv sync
uv run uvicorn main:app --reload --port 8000
```

Then open:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

### Website

```bash
cd website
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

## Which README To Read Next

If you want the active backend, read:

- [`backend/README.md`](backend/README.md)

If you want the original raw-paste prototype, read:

- [`backend/workflow-1/README.md`](backend/workflow-1/README.md)

If you want the Twitter/X + YouTube prototype, read:

- [`backend/workflow-2/README.md`](backend/workflow-2/README.md)

## Summary

This repository is best understood as a **grounded Agent Skills generator**.

It generates `SKILL.md`-centered bundles for Codex- and Claude Code-compatible skill workflows, with stronger grounding than a generic skill scaffold when the input is an existing creator corpus.