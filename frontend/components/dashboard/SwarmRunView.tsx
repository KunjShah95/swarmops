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
import { Sparkles, Plus } from "lucide-react";

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
    <div className="flex-1 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-dot opacity-[0.015]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      <div className="relative z-10 pt-24 pb-8 px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-[1600px] mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Live Swarm Run</h1>
                <p className="text-xs text-muted-foreground/60 font-mono">
                  ID: {runId.slice(0, 8)}… · Status: {runStatus}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {prUrl && (
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl hover:bg-primary/20 transition-all duration-300"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                View PR →
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-muted-foreground rounded-xl"
              onClick={() => {
                reset();
                window.location.href = "/dashboard";
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Run
            </Button>
          </div>
        </div>

        {error && (
          <div className="max-w-[1600px] mx-auto mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Main grid */}
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
          {/* Left — Agents */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex flex-col lg:col-span-3 max-h-[calc(100vh-12rem)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white/80">Swarm Agents</h2>
              <span className="text-[10px] font-mono text-muted-foreground/40 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.04]">
                {agents.length}
              </span>
            </div>
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-3 pb-4">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </ScrollArea>
          </motion.div>

          {/* Center — Chat */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 min-h-[500px]"
          >
            <SwarmChat runId={runId} />
          </motion.div>

          {/* Right — Insights */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 max-h-[calc(100vh-12rem)]"
          >
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-white/80">Run Insights</h2>
              <span className="text-[10px] font-mono text-accent/60 px-1.5 py-0.5 rounded bg-accent/5 border border-accent/10">
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
    </div>
  );
}
