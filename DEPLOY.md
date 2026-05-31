# SwarmOps Deployment Guide

Deploy SwarmOps for hackathon demos, judges, or production pilots.

## Option 1: Docker Compose (recommended)

Fastest path to a full stack on any machine with Docker Desktop.

### 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at least one of:

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Real GitHub issues and PRs |
| `GEMINI_API_KEY` | Free-tier LLM (set `LLM_PROVIDER=gemini`) |
| `GROQ_API_KEY` | Fast inference |
| `AZURE_OPENAI_*` | Microsoft/Azure hackathon track |

Without API keys, agents still run using **smart fallback** mode (good for UI demos).

### 2. Start the stack

```bash
docker compose up --build -d
```

| Service | URL |
|---------|-----|
| **App (UI + API proxy)** | http://localhost |
| **API direct** | http://localhost:8000 |
| **API docs** | http://localhost:8000/docs |
| **Health** | http://localhost:8000/health |

### 3. Verify

```bash
curl http://localhost:8000/health
docker compose ps
docker compose logs -f backend
```

### 4. Stop

```bash
docker compose down
```

Data persists in the `swarmops-data` Docker volume.

---

## Option 2: Local development (no Docker)

### Backend

```bash
cd backend
copy .env.example .env   # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to port 8000.

**Windows one-liner:** run `start-all.bat` from the project root.

---

## Option 3: Azure (hackathon / production)

### Backend — Azure Container Apps

1. Build and push the backend image:

```bash
az acr create --name swarmopsacr --resource-group swarmops-rg --sku Basic
az acr login --name swarmopsacr
docker build -t swarmopsacr.azurecr.io/swarmops-api:latest ./backend
docker push swarmopsacr.azurecr.io/swarmops-api:latest
```

2. Create Container App with env vars from `.env.example` (secrets via Key Vault or app settings).

3. Set `CORS_ORIGINS` to your frontend URL.

### Frontend — Azure Static Web Apps

```bash
cd frontend
npm run build
```

Deploy the `frontend/dist` folder to Static Web Apps. Configure `staticwebapp.config.json` to proxy `/api/*` to your Container App URL, or set the SWA API backend link in the portal.

### Azure OpenAI

Set in Container App environment:

```
LLM_PROVIDER=azure
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com/
AZURE_OPENAI_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

---

## Option 4: Render / Railway

1. **Backend:** Deploy `backend/` as a Docker or Python web service.
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add env vars from `.env.example`
   - Use a persistent disk or external DB for SQLite in production

2. **Frontend:** Deploy `frontend/dist` as a static site, or use the frontend Dockerfile with `BACKEND_URL` set in nginx (replace `backend:8000` with your API host).

---

## Environment reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | For real PRs | PAT with `repo` scope |
| `LLM_PROVIDER` | No | Provider priority list |
| `GEMINI_API_KEY` | One LLM | Google AI Studio key |
| `GROQ_API_KEY` | One LLM | Groq console key |
| `AZURE_OPENAI_*` | One LLM | Azure OpenAI resource |
| `CORS_ORIGINS` | Production | Comma-separated frontend URLs |
| `DATABASE_URL` | No | Default SQLite path |

---

## Hackathon demo checklist

- [ ] `curl /health` shows `llm.available: true` or `mode: fallback`
- [ ] Open http://localhost (Docker) or http://localhost:5173 (dev)
- [ ] Paste a GitHub issue URL on Dashboard → **Auto-Fix**
- [ ] Watch agent stream in real time
- [ ] Confirm PR link or simulated PR at end
- [ ] Rehearse 3-minute pitch (see README demo script)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS errors in browser | Add your frontend URL to `CORS_ORIGINS` |
| SSE stream stalls | Ensure nginx `proxy_buffering off` (included in `frontend/nginx.conf`) |
| Agents return instantly, no LLM | Set `LLM_PROVIDER` + API key; check `/health` |
| GitHub 401/404 | Verify `GITHUB_TOKEN` and repo access |
| SQLite locked in Docker | Use single backend replica; volume at `/data` |
