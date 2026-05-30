# State

## Current status
- Repo is in planning-only mode.
- The workspace currently contains the PRD and the new planning artifacts.
- No application scaffold or implementation code exists yet.

## Locked direction
- Use AutoGen 0.4+ with Azure OpenAI GPT-4o.
- Use FastAPI for the backend.
- Use React + Vite for the dashboard.
- Use Azure AI Search for repo grounding.
- Use Azure Service Bus as the async messaging fallback.
- Use Azure Container Apps for backend hosting and Azure Static Web Apps for the frontend.

## Risks to watch
- GitHub and Azure credential setup can block implementation if not prepared early.
- Sandboxed code execution must stay isolated from the host machine.
- The live dashboard must show real run state, not speculative agent narration.
- Demo reliability depends on selecting a small, deterministic issue for the seeded repo.

## Next step
Execute Phase 01 plan 01 to create the backend scaffold, shared schemas, and ingestion adapters.