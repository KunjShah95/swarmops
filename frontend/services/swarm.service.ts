export const DEMO_ISSUE_URL =
  "https://github.com/microsoft/vscode/issues/227757";

export interface SwarmAgent {
  id: string;
  name: string;
  role: string;
  status: "Thinking" | "Analyzing" | "Waiting" | "Completed" | "idle" | "speaking" | "running";
  avatar: string;
  key: string;
}

export const SWARM_AGENTS: SwarmAgent[] = [
  { id: "1", key: "orchestrator", name: "Orchestrator", role: "Parses issues & coordinates swarm", status: "Waiting", avatar: "🎯" },
  { id: "2", key: "planner", name: "Planner", role: "Designs multi-file fix strategy", status: "Waiting", avatar: "🗺️" },
  { id: "3", key: "code_writer", name: "Code Writer", role: "Writes production-ready diffs", status: "Waiting", avatar: "💻" },
  { id: "4", key: "test_runner", name: "Test Runner", role: "Runs automated validation", status: "Waiting", avatar: "🧪" },
  { id: "5", key: "security_auditor", name: "Security", role: "Audits vulnerabilities & quality", status: "Waiting", avatar: "🔒" },
  { id: "6", key: "pr_opener", name: "PR Opener", role: "Opens pull request with evidence", status: "Waiting", avatar: "📤" },
];

function mapStatus(raw: string): SwarmAgent["status"] {
  if (raw === "speaking" || raw === "running") return "Analyzing";
  if (raw === "completed" || raw === "done") return "Completed";
  if (raw === "thinking" || raw === "planning") return "Thinking";
  if (raw === "idle" || raw === "waiting") return "Waiting";
  return "Analyzing";
}

export function agentsFromStatuses(
  statuses: Record<string, string>
): SwarmAgent[] {
  return SWARM_AGENTS.map((agent) => ({
    ...agent,
    status: mapStatus(statuses[agent.key] || "idle"),
  }));
}

export async function startSwarmRun(issueUrl: string): Promise<string> {
  const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (!match) {
    throw new Error("Please enter a valid GitHub issue URL");
  }

  const [, owner, repo, issueNumber] = match;
  const response = await fetch("/api/issues", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      github_url: issueUrl,
      repo: `${owner}/${repo}`,
      issue_number: parseInt(issueNumber, 10),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail || "Failed to start agent swarm"
    );
  }

  const data = (await response.json()) as { run_id: string };
  return data.run_id;
}
