"""End-to-end performance benchmark for SwarmOps."""

import json
import os
import subprocess
import sys
import time

import requests

PORT = 8766
BASE = f"http://localhost:{PORT}"


def main():
    # Clean DB for fresh run
    for f in ["swarmops.db"]:
        try:
            os.remove(f)
        except FileNotFoundError:
            pass

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
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(3)

    try:
        # Health latency
        t0 = time.perf_counter()
        r = requests.get(f"{BASE}/health", timeout=5)
        health_ms = (time.perf_counter() - t0) * 1000
        print(f"Health check: {health_ms:.1f}ms (status={r.status_code})")

        # Trigger swarm
        t0 = time.perf_counter()
        r = requests.post(
            f"{BASE}/api/issues",
            json={
                "github_url": "https://github.com/test/repo/issues/1",
                "repo": "test/repo",
                "issue_number": 1,
            },
            timeout=30,
        )
        trigger_ms = (time.perf_counter() - t0) * 1000
        run_id = r.json()["run_id"]
        print(f"Trigger swarm: {trigger_ms:.1f}ms (run_id={run_id[:8]}...)")

        # Poll with agent timing
        agent_timings = {}
        start = time.perf_counter()
        data = {}
        for _ in range(60):
            time.sleep(2)
            r = requests.get(f"{BASE}/api/issues/{run_id}", timeout=5)
            data = r.json()
            elapsed = time.perf_counter() - start
            for a in data.get("agents", []):
                name, status = a["name"], a["status"]
                if status == "completed" and name not in agent_timings:
                    agent_timings[name] = elapsed
            if data["status"] in ("completed", "failed"):
                total_s = elapsed
                break
        else:
            total_s = time.perf_counter() - start

        print("\n--- Performance Results ---")
        print(f"Total E2E time: {total_s:.1f}s")
        print(f"Final status: {data.get('status', 'unknown')}")
        pr_url = data.get("pr_url") or "none"
        print(f"PR URL: {pr_url[:80]}")

        print("\nPer-agent completion times:")
        order = [
            "orchestrator",
            "planner",
            "code_writer",
            "test_runner",
            "security_auditor",
            "pr_opener",
        ]
        for name in order:
            t = agent_timings.get(name, -1)
            if t >= 0:
                print(f"  {name:20s} {t:6.1f}s")
            else:
                print(f"  {name:20s} NOT COMPLETED")

        # SSE stream test
        t0 = time.perf_counter()
        r = requests.get(f"{BASE}/api/stream/{run_id}", timeout=30)
        sse_ms = (time.perf_counter() - t0) * 1000
        events = [
            json.loads(line[6:])
            for line in r.text.strip().split("\n\n")
            if line.startswith("data: ")
        ]
        msg_count = sum(1 for e in events if e.get("event") == "message")
        status_count = sum(1 for e in events if e.get("event") == "status")
        print(f"\nSSE stream: {sse_ms:.0f}ms, {msg_count} messages, {status_count} status events")

        print("\n--- Verdict ---")
        ok = data.get("status") == "completed" and len(agent_timings) == 6
        print("SWARMOPS E2E: PASS" if ok else "SWARMOPS E2E: FAIL")
        return 0 if ok else 1

    finally:
        proc.terminate()
        proc.wait()


if __name__ == "__main__":
    sys.exit(main())
