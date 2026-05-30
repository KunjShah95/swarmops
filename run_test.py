"""Run SwarmOps end-to-end test."""

import subprocess
import time
import httpx
import json
import sys
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Clean DB
for f in ["swarmops.db", "test.db"]:
    try:
        os.remove(os.path.join("backend", f))
    except FileNotFoundError:
        pass

# Start backend server
proc = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8765",
        "--log-level",
        "warning",
    ],
    cwd="backend",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

time.sleep(3)

BASE = "http://localhost:8765"
passed = 0
failed = 0


def check(name, ok, detail=""):
    global passed, failed
    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] {name}" + (f" - {detail}" if detail else ""))
    if ok:
        passed += 1
    else:
        failed += 1


try:
    # 1. Health
    r = httpx.get(f"{BASE}/health", timeout=5)
    check("Health endpoint", r.status_code == 200)

    # 2. Trigger swarm
    r = httpx.post(
        f"{BASE}/api/issues",
        json={
            "github_url": "https://github.com/test/repo/issues/1",
            "repo": "test/repo",
            "issue_number": 1,
        },
        timeout=15,
    )
    check("POST /api/issues", r.status_code == 200, f"Got {r.status_code}")
    data = r.json()
    run_id = data.get("run_id", "")
    check("Run ID returned", bool(run_id))
    check("Status is started", data.get("status") == "started")

    # 3. Wait for agents to complete
    for i in range(30):
        time.sleep(1)
        r = httpx.get(f"{BASE}/api/issues/{run_id}", timeout=5)
        status = r.json().get("status", "")
        if status in ("completed", "failed"):
            break
    check(f"Run finished (status={status})", status == "completed", f"Final: {status}")
    print(f"       Completed in {i + 1}s")

    # 4. Read SSE events
    r = httpx.get(f"{BASE}/api/stream/{run_id}", timeout=10)
    events = []
    for line in r.text.strip().split("\n\n"):
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    msg_agents = set()
    msg_types = set()
    has_data = False
    for evt in events:
        if evt.get("event") == "message":
            msg_agents.add(evt.get("agent"))
            msg_types.add(evt.get("type"))
            if evt.get("data"):
                has_data = True

    expected_agents = {
        "orchestrator",
        "planner",
        "code_writer",
        "test_runner",
        "security_auditor",
        "pr_opener",
    }
    expected_types = {"plan", "code", "test", "security", "pr"}

    check(
        "All 6 agents executed",
        msg_agents == expected_agents,
        f"Missing: {expected_agents - msg_agents}",
    )
    check(
        "All message types",
        msg_types.issuperset(expected_types),
        f"Missing: {expected_types - msg_types}",
    )
    check("Structured data present", has_data)

    # 5. Verify final state
    r = httpx.get(f"{BASE}/api/issues/{run_id}", timeout=5)
    final = r.json()
    check("Run completed", final.get("status") == "completed")
    check("PR URL generated", bool(final.get("pr_url")))

    all_done = all(a["status"] == "completed" for a in final["agents"])
    check(
        "All agents completed",
        all_done,
        str([(a["name"], a["status"]) for a in final["agents"]]),
    )

except Exception as e:
    print(f"\n[ERROR] {e}")
    failed += 1

finally:
    proc.terminate()
    proc.wait()

print(f"\n{'=' * 50}")
print(f" RESULTS: {passed} passed, {failed} failed out of {passed + failed}")
print(f"{'=' * 50}")
sys.exit(1 if failed > 0 else 0)
