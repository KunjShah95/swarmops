# SwarmOps

**Autonomous DevOps Agent Swarm** — GitHub Issue → Agents Plan, Code, Test, Validate → PR opened. Zero humans.

**Hackathon:** Microsoft Build with AI  
**Theme:** Agent Swarms — Multi-Agent Orchestration with AutoGen + Azure

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Azure account (free tier)
- GitHub personal access token

### 1. Clone & Setup

```bash
git clone <repo-url>
cd swarmops
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Create `.env` File

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Backend

```bash
uvicorn main:app --reload --port 8000
```

### 5. Frontend Setup (in another terminal)

```bash
cd frontend
npm install
npm run dev
```

### 6. Open Dashboard

Navigate to `http://localhost:5173`

---

## Architecture

```
GitHub Issue ──► FastAPI Backend ──► AutoGen GroupChat ──► GitHub PR
                      │
                ┌─────┴─────┐
                ▼           ▼
           SQLite DB    React Dashboard
                        (streaming agent chat)
```

---

## Team

| Role | Member | Focus |
|------|--------|-------|
| Backend + DB | You | FastAPI, AutoGen agents, SQLite |
| AI + Frontend | Friend | Azure OpenAI, React dashboard |

---

## Tech Stack

### Backend
- **FastAPI** — REST API + SSE streaming
- **AutoGen 0.4+** — Agent swarm orchestration
- **Azure OpenAI GPT-4o** — Agent reasoning
- **SQLite + SQLAlchemy** — Local database
- **PyGithub** — GitHub API integration

### Frontend
- **React 18 + Vite** — UI framework
- **Tailwind CSS** — Styling
- **Zustand** — State management
- **Monaco Editor** — Code diff viewer
- **SSE (EventSource)** — Real-time streaming

### Azure (Minimal)
- **Azure OpenAI** — GPT-4o deployment
- **Azure AI Search** — Codebase RAG (optional)
- **Azure Container Apps** — Optional deploy

---

## Demo

**3-minute live walkthrough:**
1. **0:00–0:30** — Show a real GitHub issue
2. **0:30–1:30** — Click "Auto-Fix", watch 5 agents debate in real-time
3. **1:30–2:00** — PR opened with full test evidence
4. **2:00–3:00** — Architecture deep dive

---

## License

MIT License — Hackathon project
