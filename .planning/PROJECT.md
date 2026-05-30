# Autonomous DevOps Swarm

## Vision
Build a fully autonomous GitHub Issue → Agents Plan, Code, Test, Validate → PR pipeline using AutoGen, Azure OpenAI, and Azure-native infrastructure. The live agent conversation panel is the demo.

## Product shape
- **Primary experience:** a 5-agent swarm that reads a GitHub issue, reasons about the fix, writes code, runs tests, checks security, and opens a PR.
- **Primary demo surface:** a React dashboard streaming the live conversation, diff, test results, security findings, and PR URL.
- **Primary promise:** zero-human runtime execution once the issue is submitted.

## Locked technical decisions from the PRD
- **AI orchestration:** AutoGen 0.4+ GroupChat
- **LLM:** Azure OpenAI GPT-4o
- **Repo grounding:** Azure AI Search
- **Safe code execution:** Semantic Kernel code plugin
- **Backend:** FastAPI on Azure Container Apps
- **Async messaging:** Azure Service Bus
- **GitHub integration:** GitHub REST API
- **Frontend:** React + Vite with WebSocket / SSE streaming
- **Diff viewer:** Monaco Editor
- **Frontend hosting:** Azure Static Web Apps

## Non-negotiables
- Keep every agent output structured and machine-readable.
- Treat GitHub issue text as untrusted input.
- Never invent file paths, tests, or passing results.
- Block PR creation if tests or security checks fail.
- Keep the live dashboard honest: stream actual state, not synthesized filler.

## Demo constraints
- One click starts the swarm.
- The agent conversation stream is visible in real time.
- The fix must end in a real PR with test evidence and security review.
- The demo should work against a small seeded public repo with a simple, believable bug.

## Required human setup
- GitHub App or OAuth app credentials with repo access.
- Azure subscription and permissions to create Azure OpenAI, AI Search, Service Bus, Container Apps, and Static Web Apps resources.
- A demo repository that can safely receive automated PRs.

## What success looks like
A judge can watch the swarm ingest an issue, debate the approach, make a fix, validate it, and open a PR without the operator alt-tabbing to a terminal. The system should feel like a polished product, not a research notebook with a pulse.