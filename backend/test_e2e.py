"""End-to-end test using FastAPI TestClient (no external server needed)."""

import json
import sys
import os

# Clean any stale databases
for f in ["swarmops.db", "test.db"]:
    try:
        os.remove(f)
    except FileNotFoundError:
        pass

from fastapi.testclient import TestClient
from database import init_db
import models  # noqa: F401 — register ORM tables before create_all

init_db()

from main import app

client = TestClient(app)

passed = 0
failed = 0


def check(name, ok, detail=""):
    global passed, failed
    if ok:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {detail}")
        failed += 1


# 1. Health check
r = client.get("/health")
check("Health endpoint", r.status_code == 200)
check("Health status ok", r.json().get("status") == "ok")

# 2. Trigger swarm
r = client.post(
    "/api/issues",
    json={
        "github_url": "https://github.com/test/demo/issues/42",
        "repo": "test/demo",
        "issue_number": 42,
    },
)
check("POST /api/issues", r.status_code == 200, f"Got {r.status_code}")
data = r.json()
run_id = data.get("run_id", "")
check("Run ID returned", bool(run_id))
check("Status is started", data.get("status") == "started")

# 3. Poll for completion
import time

for i in range(120):  # 60s window: LLM-chained swarm can take 30-60s
    time.sleep(0.5)
    r = client.get(f"/api/issues/{run_id}")
    status = r.json().get("status", "")
    if status in ("completed", "failed"):
        break

check(f"Run finished (status={status})", status == "completed", f"Final: {status}")
elapsed = (i + 1) * 0.5
print(f"       Completed in {elapsed:.1f}s")

# 4. Check SSE events
r = client.get(f"/api/stream/{run_id}")
events = []
for line in r.text.strip().split("\n\n"):
    if line.startswith("data: "):
        events.append(json.loads(line[6:]))

msg_agents = set()
msg_types = set()
has_data = False
status_events = 0
for evt in events:
    if evt.get("event") == "message":
        msg_agents.add(evt.get("agent"))
        msg_types.add(evt.get("type"))
        if evt.get("data"):
            has_data = True
    elif evt.get("event") == "status":
        status_events += 1

expected_agents = {
    "orchestrator",
    "planner",
    "code_writer",
    "test_runner",
    "security_auditor",
    "pr_opener",
}
expected_types = {"plan", "code", "test", "security", "pr"}

check("All 6 agents ran", msg_agents == expected_agents, f"Missing: {expected_agents - msg_agents}")
check(
    "All message types",
    msg_types.issuperset(expected_types),
    f"Missing: {expected_types - msg_types}",
)
check("Structured data in messages", has_data)
check("Status events emitted", status_events > 0, f"Got {status_events}")

# 5. Verify final run state
r = client.get(f"/api/issues/{run_id}")
final = r.json()
check("Run completed in DB", final.get("status") == "completed", f"Got {final.get('status')}")
check("PR URL present", bool(final.get("pr_url")))
all_completed = all(a["status"] == "completed" for a in final["agents"])
check(
    "All agents completed", all_completed, str([(a["name"], a["status"]) for a in final["agents"]])
)

# 6. Print details
print()
print("--- Agent Messages ---")
for evt in events:
    if evt.get("event") == "message":
        ag = evt.get("agent", "?")
        tp = evt.get("type", "?")
        dt = list(evt.get("data", {}).keys()) if evt.get("data") else []
        print(f"  {ag:20s} [{tp:8s}] data_keys={dt}")

print()
print(f"--- Agent Final States ---")
for a in final["agents"]:
    print(f"  {a['name']:20s} status={a['status']} confidence={a.get('confidence', 0)}")

print()
print(f"PR URL: {final.get('pr_url')}")
print()
print("=" * 50)
print(f" RESULTS: {passed} passed, {failed} failed out of {passed + failed}")
print("=" * 50)
sys.exit(1 if failed > 0 else 0)
