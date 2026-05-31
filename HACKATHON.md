# SwarmOps — Hackathon Judge Pack

**One-liner:** Paste a GitHub issue → six AI agents plan, code, test, audit, and open a PR — live on screen.

## 30-second pitch

DevOps teams spend hours turning issues into PRs. SwarmOps runs a **sequential agent swarm** — Orchestrator, Planner, Code Writer, Test Runner, Security Auditor, PR Opener — orchestrated with FastAPI and streamed to a React dashboard via SSE. Built for **Microsoft Build with AI 2026** (Agent Swarms theme).

## Live demo (3 min)

| Time | What to show |
|------|----------------|
| 0:00 | Landing page — problem statement |
| 0:30 | Dashboard — paste issue URL, click **Auto-Fix** |
| 1:00 | Agent chat — six agents debating in real time |
| 1:30 | Diff + test + security panels |
| 2:00 | PR link (real or simulated) |
| 2:30 | Architecture diagram in README / About page |

## Pre-demo setup (5 min)

```bash
cp .env.example .env
# Add GEMINI_API_KEY or AZURE_OPENAI_* (optional: works in fallback mode)
docker compose up --build -d
```

Open **http://localhost** → Dashboard.

**Demo issue (public):**  
`https://github.com/microsoft/vscode/issues/227757`

## What works without credentials

| Feature | Without keys | With keys |
|---------|--------------|-----------|
| UI + agent stream | Yes | Yes |
| LLM reasoning | Smart fallback | Live models |
| GitHub issue fetch | Fallback mock | Real issue |
| Open PR | Simulated URL | Real PR |

## Tech highlights for judges

- **Multi-agent pipeline** with shared context and self-healing retries
- **Multi-LLM router** — Gemini, Groq, OpenRouter, Azure OpenAI
- **SSE real-time UI** — hero feature for hackathon impact
- **Docker-ready** — `docker compose up` for judges to try locally
- **CI** — GitHub Actions on every push

## Team split

| Area | Stack |
|------|-------|
| Backend + agents | FastAPI, SQLAlchemy, PyGithub |
| Frontend | Next.js, Tailwind, shadcn, Zustand |
| AI | Azure OpenAI / Gemini / Groq via unified LLM service |

## Links

- [README.md](README.md) — full documentation
- [DEPLOY.md](DEPLOY.md) — deployment options
- [QUICKSTART.md](QUICKSTART.md) — team onboarding
