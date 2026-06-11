"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEMO_ISSUE_URL, startSwarmRun } from "@/services/swarm.service";
import { useSwarmStore } from "@/store/useSwarmStore";
import { Sparkles, ArrowRight, GitBranch } from "lucide-react";

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
    <div className="w-full max-w-lg mx-auto">
      <div className="glass-strong rounded-3xl p-10 relative overflow-hidden">
        {/* Inner glow */}
        <div className="absolute top-[-20%] right-[-20%] w-48 h-48 bg-primary/[0.04] blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-20%] w-48 h-48 bg-secondary/[0.04] blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <GitBranch className="h-8 w-8 text-primary" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-accent mb-4 gradient-border">
            <Sparkles className="h-3 w-3" />
            Agent Swarm
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Start an Agent Swarm</h2>
          <p className="text-sm text-muted-foreground/80 mb-8 leading-relaxed">
            Paste a GitHub issue URL. Six agents will plan, code, test, audit, and open a PR — streamed live.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={issueUrl}
                onChange={(e) => setIssueUrl(e.target.value)}
                placeholder="https://github.com/owner/repo/issues/42"
                className="w-full px-5 py-3.5 bg-white/[0.02] border border-white/[0.08] rounded-xl text-white text-sm text-center focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all duration-300 placeholder:text-muted-foreground/40"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="glow"
              className="w-full h-12 text-base rounded-xl group"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Starting Swarm…
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  Auto-Fix Issue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setIssueUrl(DEMO_ISSUE_URL)}
              className="w-full border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-muted-foreground/70 hover:text-white rounded-xl h-11 text-sm transition-all duration-300"
            >
              Try demo issue (VS Code bug)
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
