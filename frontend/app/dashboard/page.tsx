"use client";

import { useState } from "react";
import { IssueStartForm } from "@/components/swarm/IssueStartForm";
import { SwarmRunView } from "@/components/dashboard/SwarmRunView";
import { useSwarmStore } from "@/store/useSwarmStore";

export default function DashboardPage() {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const setRunId = useSwarmStore((s) => s.setRunId);

  const handleStarted = (runId: string) => {
    setRunId(runId);
    setActiveRunId(runId);
  };

  if (activeRunId) {
    return <SwarmRunView runId={activeRunId} />;
  }

  return (
    <div className="flex-1 bg-background p-6 md:p-10 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <IssueStartForm onStarted={handleStarted} />
    </div>
  );
}
