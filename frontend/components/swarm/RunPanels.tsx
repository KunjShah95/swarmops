"use client";

import { Card } from "@/components/ui/card";
import { useSwarmStore } from "@/store/useSwarmStore";

export function TestResultsPanel() {
  const messages = useSwarmStore((s) => s.messages);
  const testMsg = messages.find((m) => m.type === "test");
  const data = testMsg?.data as {
    tests_passed?: number;
    tests_failed?: number;
    success?: boolean;
  } | undefined;

  if (!testMsg) {
    return (
      <Card className="glass border-white/10 p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tests</h4>
        <p className="text-xs text-muted-foreground text-center py-4">Waiting…</p>
      </Card>
    );
  }

  const passed = data?.tests_passed ?? 0;
  const failed = data?.tests_failed ?? 0;

  return (
    <Card className="glass border-white/10 p-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Tests</h4>
      <div className="flex gap-2 mb-2">
        <div className="flex-1 text-center p-2 rounded bg-green-500/10 border border-green-500/20">
          <div className="text-lg font-bold text-green-400">{passed}</div>
          <div className="text-xs text-green-300">Passed</div>
        </div>
        <div className="flex-1 text-center p-2 rounded bg-red-500/10 border border-red-500/20">
          <div className="text-lg font-bold text-red-400">{failed}</div>
          <div className="text-xs text-red-300">Failed</div>
        </div>
      </div>
      <p className={`text-xs ${data?.success ? "text-green-400" : "text-red-400"}`}>
        {data?.success ? "✅ All tests passed" : "❌ Some tests failed"}
      </p>
    </Card>
  );
}

export function SecurityPanel() {
  const messages = useSwarmStore((s) => s.messages);
  const secMsg = messages.find((m) => m.type === "security");
  const data = secMsg?.data as {
    passed?: boolean;
    findings?: { severity: string; issue: string }[];
    summary?: string;
  } | undefined;

  if (!secMsg) {
    return (
      <Card className="glass border-white/10 p-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Security</h4>
        <p className="text-xs text-muted-foreground text-center py-4">Pending…</p>
      </Card>
    );
  }

  const findings = data?.findings ?? [];

  return (
    <Card className="glass border-white/10 p-4">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Security</h4>
      <div
        className={`text-center p-2 rounded mb-2 text-sm font-medium ${
          data?.passed
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {data?.passed ? "✅ All Clear" : "⚠️ Issues Found"}
      </div>
      {findings.slice(0, 3).map((f, i) => (
        <div key={i} className="text-xs text-muted-foreground mb-1">
          [{f.severity}] {f.issue}
        </div>
      ))}
    </Card>
  );
}

export function PRPanel() {
  const prUrl = useSwarmStore((s) => s.prUrl);
  const runStatus = useSwarmStore((s) => s.runStatus);
  const messages = useSwarmStore((s) => s.messages);
  const prMsg = messages.find((m) => m.type === "pr");
  const data = prMsg?.data as { pr_number?: number; branch?: string } | undefined;

  return (
    <Card className="glass border-white/10 p-4 flex flex-col items-center justify-center min-h-[120px]">
      <h4 className="text-sm font-semibold text-muted-foreground mb-3 self-start w-full">
        Pull Request
      </h4>
      {prUrl ? (
        <>
          <span className="text-2xl mb-2">📤</span>
          <a
            href={prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded-lg text-xs font-medium text-white"
          >
            View PR #{data?.pr_number ?? ""} →
          </a>
          {data?.branch && (
            <p className="text-xs text-muted-foreground mt-2">Branch: {data.branch}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          {runStatus === "completed" ? "No PR created" : "Waiting for PR Opener…"}
        </p>
      )}
    </Card>
  );
}
