"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useSwarmStore } from "@/store/useSwarmStore";
import { useAgentStore } from "@/store/useAgentStore";
import { useChatStore } from "@/store/useChatStore";
import { useAnalysisStore } from "@/store/useAnalysisStore";
import { useAgentStream } from "@/hooks/useAgentStream";
import { AgentCard } from "@/components/agents/AgentCard";
import { SwarmChat } from "@/components/chat/SwarmChat";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { SwarmAnalysisTabs } from "@/components/dashboard/SwarmAnalysisTabs";
import { DiffViewer } from "@/components/swarm/DiffViewer";
import { TestResultsPanel, SecurityPanel, PRPanel } from "@/components/swarm/RunPanels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
interface SwarmRunViewProps {
  runId: string;
}

export function SwarmRunView({ runId }: SwarmRunViewProps) {
  const { agents, syncFromSwarm: syncAgents } = useAgentStore();
  const { insights, syncFromSwarm: syncInsights } = useAnalysisStore();
  const syncChat = useChatStore((s) => s.syncFromSwarm);
  const runStatus = useSwarmStore((s) => s.runStatus);
  const prUrl = useSwarmStore((s) => s.prUrl);
  const error = useSwarmStore((s) => s.error);
  const reset = useSwarmStore((s) => s.reset);

  useAgentStream(runId);

  useEffect(() => {
    const unsub = useSwarmStore.subscribe(() => {
      syncAgents();
      syncChat();
      syncInsights();
    });
    syncAgents();
    syncChat();
    syncInsights();
    return unsub;
  }, [syncAgents, syncChat, syncInsights]);

  return (
    <div className="flex-1 bg-background p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1600px] mx-auto mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Live Swarm Run</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {runId.slice(0, 8)}… · {runStatus}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm px-3 py-1.5 bg-primary rounded-lg text-white hover:bg-primary/90"
            >
              View PR →
            </a>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              reset();
              window.location.href = "/dashboard";
            }}
          >
            + New Run
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col lg:col-span-3 max-h-[calc(100vh-12rem)]"
        >
          <h2 className="text-lg font-bold text-white mb-1">Swarm Agents</h2>
          <p className="text-sm text-muted-foreground mb-4">Six specialized nodes</p>
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3 pb-4">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 min-h-[500px]"
        >
          <SwarmChat runId={runId} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 max-h-[calc(100vh-12rem)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Run Insights</h2>
              <p className="text-sm text-muted-foreground">Live pipeline metrics</p>
            </div>
            <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-accent">
              LIVE
            </span>
          </div>
          <ScrollArea className="h-full pr-2">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
            <SwarmAnalysisTabs />
            <div className="mt-4 space-y-4">
              <DiffViewer />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <TestResultsPanel />
                <SecurityPanel />
                <PRPanel />
              </div>
            </div>
            <div className="h-8" />
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
}
