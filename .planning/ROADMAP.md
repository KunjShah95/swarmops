# Roadmap

This roadmap turns the PRD into three execution phases with clear dependency boundaries and full requirement coverage.

## Requirement coverage

| Requirement ID | Meaning | Covered by |
|---|---|---|
| DS-01 | Ingest GitHub issues and repo context | Phase 01 / Plan 01 |
| DS-02 | Normalize work into structured agent tasks | Phase 01 / Plan 01 and Plan 02 |
| DS-03 | Generate code fixes grounded in repo context | Phase 01 / Plan 02 |
| DS-04 | Run tests and security checks with revision loops | Phase 02 / Plan 01 |
| DS-05 | Open PRs and publish run results to GitHub | Phase 02 / Plan 02 |
| DS-06 | Stream live reasoning, diffs, tests, and PR status to the dashboard | Phase 03 / Plan 01 |
| DS-07 | Deploy backend and frontend to Azure | Phase 03 / Plan 02 |
| DS-08 | Produce pitch-ready docs, demo assets, and a reproducible walkthrough | Phase 03 / Plan 02 |

## Phase 01 — Swarm foundation
Goal: create the backend scaffold, shared schemas, GitHub/repo adapters, and the core AutoGen orchestration loop.

Plans:
- [ ] `01-swarm-foundation/01-01-PLAN.md` — backend scaffold, config, issue ingestion, and shared contracts
- [ ] `01-swarm-foundation/01-02-PLAN.md` — AutoGen orchestration, planner/code-writer prompts, and safe code execution

## Phase 02 — Validation and PR closure
Goal: make the swarm prove its work by running tests, scanning for security issues, and opening a PR only when the run is clean.

Plans:
- [ ] `02-swarm-gates/02-01-PLAN.md` — test runner, security auditor, and revision feedback loop
- [ ] `02-swarm-gates/02-02-PLAN.md` — branch/commit/PR workflow and end-to-end run API

## Phase 03 — Dashboard, deploy, and demo
Goal: expose the live swarm to humans through a streaming dashboard, deploy the stack to Azure, and package the hackathon demo.

Plans:
- [ ] `03-swarm-demo/03-01-PLAN.md` — streaming dashboard, live conversation panel, diff viewer, and status cards
- [ ] `03-swarm-demo/03-02-PLAN.md` — Azure deployment, demo hardening, README, and pitch assets

## Delivery order
1. Phase 01 builds the core backend contracts and orchestration loop.
2. Phase 02 adds validation gates and PR automation.
3. Phase 03 turns the backend into a visible product and makes it demo-ready.

## Notes
- The roadmap intentionally keeps the agent reasoning path visible from the very first issue event through the final PR.
- The demo surface is not an afterthought; it is part of the product value.
- The stack is fixed by the PRD and should not be swapped without a deliberate decision.