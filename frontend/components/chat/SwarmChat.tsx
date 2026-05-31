"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useSwarmStore } from "@/store/useSwarmStore";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    <div className="flex flex-col h-full min-h-[500px] bg-background border border-white/10 rounded-2xl overflow-hidden glass relative">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-white">Live Swarm Discussion</h3>
          <p className="text-xs text-muted-foreground font-mono">Run {runId.slice(0, 8)}…</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              runStatus === "completed"
                ? "bg-green-500/20 text-green-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {statusLabel}
          </span>
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 bg-primary rounded text-white hover:bg-primary/90"
            >
              PR →
            </a>
          )}
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground py-12 animate-pulse">
              Agents are initializing…
            </p>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator agentName={typingAgent || undefined} />}
        </div>
      </ScrollArea>

      {error && (
        <div className="px-4 py-2 border-t border-red-500/20 bg-red-500/10 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-muted-foreground">
          Swarm is operating autonomously on your GitHub issue…
        </div>
      </div>
    </div>
  );
}
