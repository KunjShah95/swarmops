import { create } from "zustand";

export interface AgentMessage {
  agent: string;
  content: string;
  type: string;
  timestamp: Date;
  sequence?: number;
  data?: Record<string, unknown>;
}

interface SwarmState {
  messages: AgentMessage[];
  agentStatuses: Record<string, string>;
  runStatus: string;
  prUrl: string | null;
  error: string | null;
  runId: string | null;
  issueUrl: string;
  tokensUsed: number;
  estimatedCost: number;
  addMessage: (msg: AgentMessage) => void;
  updateAgentStatus: (agent: string, status: string) => void;
  setRunStatus: (status: string) => void;
  setPrUrl: (url: string) => void;
  setError: (error: string | null) => void;
  setRunId: (runId: string | null) => void;
  setIssueUrl: (url: string) => void;
  setTokensUsed: (tokens: number) => void;
  setEstimatedCost: (cost: number) => void;
  reset: () => void;
}

const initialStatuses = {
  orchestrator: "idle",
  planner: "idle",
  code_writer: "idle",
  test_runner: "idle",
  security_auditor: "idle",
  pr_opener: "idle",
};

export const useSwarmStore = create<SwarmState>((set) => ({
  messages: [],
  agentStatuses: { ...initialStatuses },
  runStatus: "idle",
  prUrl: null,
  error: null,
  runId: null,
  issueUrl: "",
  tokensUsed: 0,
  estimatedCost: 0.0,

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  updateAgentStatus: (agent, status) =>
    set((state) => ({
      agentStatuses: { ...state.agentStatuses, [agent]: status },
    })),

  setRunStatus: (status) => set({ runStatus: status }),
  setPrUrl: (url) => set({ prUrl: url }),
  setError: (error) => set({ error }),
  setRunId: (runId) => set({ runId }),
  setIssueUrl: (url) => set({ issueUrl: url }),
  setTokensUsed: (tokensUsed) => set({ tokensUsed }),
  setEstimatedCost: (estimatedCost) => set({ estimatedCost }),

  reset: () =>
    set((state) => ({
      messages: [],
      agentStatuses: { ...initialStatuses },
      runStatus: "idle",
      prUrl: null,
      error: null,
      runId: null,
      issueUrl: state.issueUrl,
      tokensUsed: 0,
      estimatedCost: 0.0,
    })),
}));
