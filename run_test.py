import subprocess, time, sys, os, json, requests

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

# Clean DB
for f in ["swarmops.db", "test.db"]:
    try:
        os.remove(os.path.join(os.getcwd(), f))
    except:
        pass

PORT = 8765
BASE = f"http://localhost:{PORT}"

# Start uvicorn
proc = subprocess.Popen(
    [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--host",
        "0.0.0.0",
        "--port",
        str(PORT),
        "--log-level",
        "warning",
    ],
    cwd=os.getcwd(),
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

time.sleep(3)

passed, failed = 0, 0


def check(name, ok, detail=""):
    global passed, failed
    s = "PASS" if ok else "FAIL"
    print(f"  [{s}] {name}" + (f" - {detail}" if detail else ""))
    if ok:
        passed += 1
    else:
        failed += 1


try:
    # 1. Health
    r = requests.get(f"{BASE}/health", timeout=5)
    check("Health endpoint", r.status_code == 200)

    # 2. Trigger swarm
    r = requests.post(
        f"{BASE}/api/issues",
        json={
            "github_url": "https://github.com/test/repo/issues/1",
            "repo": "test/repo",
            "issue_number": 1,
        },
        timeout=30,
    )
    check("POST /api/issues", r.status_code == 200)
    run_id = r.json().get("run_id", "")
    check("Run ID returned", bool(run_id))

    # 3. Wait for agents
    for i in range(40):
        time.sleep(3)
        r = requests.get(f"{BASE}/api/issues/{run_id}", timeout=5)
        status = r.json().get("status", "")
        agents = r.json().get("agents", [])
        print(
            f"       [{i * 3}s] status={status}  agents={[(a['name'], a['status']) for a in agents]}"
        )
        if status in ("completed", "failed"):
            break

    check(
        "Run finished",
        status == "completed",
        f"status={status}, error={r.json().get('error', 'none')}",
    )

    # 4. Check SSE
    r = requests.get(f"{BASE}/api/stream/{run_id}", timeout=10)
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
    check("All 6 agents executed", msg_agents == expected_agents)
    check("All message types", msg_types.issuperset(expected_types))
    check("Structured data present", has_data)

    # 5. Final state
    r = requests.get(f"{BASE}/api/issues/{run_id}", timeout=5)
    final = r.json()
    check("Run completed flag", final.get("status") == "completed")
    check("PR URL generated", bool(final.get("pr_url")))
    all_done = all(a["status"] == "completed" for a in final["agents"])
    check("All agents completed", all_done)

except Exception as e:
    import traceback

    print(f"\n[ERROR] {e}")
    traceback.print_exc()
    failed += 1

finally:
    proc.terminate()
    proc.wait()

print(f"\n{'=' * 50}")
print(f" RESULTS: {passed} passed, {failed} failed out of {passed + failed}")
print(f"{'=' * 50}")
sys.exit(1 if failed > 0 else 0)
