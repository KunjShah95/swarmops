"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEMO_ISSUE_URL, startSwarmRun } from "@/services/swarm.service";
import { useSwarmStore } from "@/store/useSwarmStore";

interface IssueStartFormProps {
  onStarted: (runId: string) => void;
}

export function IssueStartForm({ onStarted }: IssueStartFormProps) {
  const issueUrl = useSwarmStore((s) => s.issueUrl);
  const setIssueUrl = useSwarmStore((s) => s.setIssueUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const runId = await startSwarmRun(issueUrl.trim());
      onStarted(runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start swarm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto text-center">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-2xl font-bold text-white mb-2">Start an Agent Swarm</h2>
      <p className="text-muted-foreground mb-8">
        Paste a GitHub issue URL. Six agents will plan, code, test, audit, and open a PR — live on screen.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="url"
          value={issueUrl}
          onChange={(e) => setIssueUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/issues/42"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
        >
          {loading ? "Starting Swarm…" : "🚀 Auto-Fix Issue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => setIssueUrl(DEMO_ISSUE_URL)}
          className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground"
        >
          Use demo issue (VS Code public bug)
        </Button>
      </form>
    </div>
  );
}
