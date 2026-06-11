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
    <div className="flex-1 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-dot opacity-20" />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-secondary/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center min-h-screen pt-14">
        <IssueStartForm onStarted={handleStarted} />
      </div>
    </div>
  );
}
