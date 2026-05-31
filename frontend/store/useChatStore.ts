import { create } from "zustand";
import { ChatMessage } from "@/types";
import { useSwarmStore } from "@/store/useSwarmStore";

const AGENT_META: Record<string, { name: string; avatar: string }> = {
  orchestrator: { name: "Orchestrator", avatar: "🎯" },
  planner: { name: "Planner", avatar: "🗺️" },
  code_writer: { name: "Code Writer", avatar: "💻" },
  test_runner: { name: "Test Runner", avatar: "🧪" },
  security_auditor: { name: "Security", avatar: "🔒" },
  pr_opener: { name: "PR Opener", avatar: "📤" },
};

interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  typingAgent: string | null;
  syncFromSwarm: () => void;
  setTyping: (isTyping: boolean, agentName?: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isTyping: false,
  typingAgent: null,
  syncFromSwarm: () => {
    const swarmMessages = useSwarmStore.getState().messages;
    const runStatus = useSwarmStore.getState().runStatus;
    const messages: ChatMessage[] = swarmMessages.map((msg, i) => {
      const meta = AGENT_META[msg.agent] || { name: msg.agent, avatar: "🤖" };
      return {
        id: `${msg.sequence ?? i}-${msg.agent}`,
        agentId: msg.agent,
        agentName: meta.name,
        avatar: meta.avatar,
        timestamp: msg.timestamp.toISOString(),
        message: msg.content,
        type: msg.type,
      };
    });
    const last = swarmMessages[swarmMessages.length - 1];
    const typing =
      runStatus === "running" && swarmMessages.length > 0 && last?.agent;
    set({
      messages,
      isTyping: Boolean(typing),
      typingAgent: typing
        ? AGENT_META[last.agent]?.name || last.agent
        : null,
    });
  },
  setTyping: (isTyping, agentName = null) => set({ isTyping, typingAgent: agentName }),
}));
