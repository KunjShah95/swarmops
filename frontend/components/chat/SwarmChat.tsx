"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useSwarmStore } from "@/store/useSwarmStore";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SwarmChatProps {
  runId: string;
}

export const SwarmChat = ({ runId }: SwarmChatProps) => {
  const { messages, isTyping, typingAgent, syncFromSwarm } = useChatStore();
  const runStatus = useSwarmStore((s) => s.runStatus);
  const prUrl = useSwarmStore((s) => s.prUrl);
  const error = useSwarmStore((s) => s.error);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = useSwarmStore.subscribe(() => syncFromSwarm());
    syncFromSwarm();
    return unsub;
  }, [syncFromSwarm]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const statusLabel =
    error ? "Failed" : runStatus === "completed" ? "Completed" : runStatus === "running" ? "Running" : "Active";

  return (
    <div className="flex flex-col h-full min-h-[500px] glass border-white/[0.06] rounded-2xl overflow-hidden relative group">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white/90">Live Swarm Discussion</h3>
          <p className="text-[11px] text-muted-foreground/50 font-mono mt-0.5">Run {runId.slice(0, 8)}…</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "text-[10px] font-medium px-2.5 py-1 rounded-full border",
              runStatus === "completed"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : runStatus === "failed" || error
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            )}
          >
            {statusLabel}
          </span>
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all duration-300"
            >
              PR →
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-5" ref={scrollRef}>
        <div className="space-y-1">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground/50 py-16 text-sm">
              Agents are initializing…
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator agentName={typingAgent || undefined} />}
        </div>
      </ScrollArea>

      {/* Error footer */}
      {error && (
        <div className="px-5 py-2.5 border-t border-red-500/20 bg-red-500/5 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Input bar */}
      <div className="px-5 py-3.5 border-t border-white/[0.06] bg-white/[0.02]">
        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-muted-foreground/50">
          Swarm is operating autonomously on your GitHub issue…
        </div>
      </div>
    </div>
  );
};
