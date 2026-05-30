import { create } from 'zustand'

interface AgentMessage {
  agent: string
  content: string
  type: string
  timestamp: Date
  sequence?: number
  data?: Record<string, unknown>
}

interface AgentStatus {
  name: string
  status: string
  confidence?: number
}

interface AgentState {
  messages: AgentMessage[]
  agentStatuses: Record<string, string>
  runStatus: string
  prUrl: string | null
  error: string | null
  addMessage: (msg: AgentMessage) => void
  updateAgentStatus: (agent: string, status: string) => void
  setRunStatus: (status: string) => void
  setPrUrl: (url: string) => void
  setError: (error: string) => void
  reset: () => void
}

export const agentStore = create<AgentState>((set) => ({
  messages: [],
  agentStatuses: {
    orchestrator: 'idle',
    planner: 'idle',
    code_writer: 'idle',
    test_runner: 'idle',
    security_auditor: 'idle',
    pr_opener: 'idle',
  },
  runStatus: 'idle',
  prUrl: null,
  error: null,

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

  reset: () =>
    set({
      messages: [],
      agentStatuses: {
        orchestrator: 'idle',
        planner: 'idle',
        code_writer: 'idle',
        test_runner: 'idle',
        security_auditor: 'idle',
        pr_opener: 'idle',
      },
      runStatus: 'idle',
      prUrl: null,
      error: null,
    }),
}))
