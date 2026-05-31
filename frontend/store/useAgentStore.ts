import { create } from "zustand";
import { SwarmAgent, agentsFromStatuses } from "@/services/swarm.service";
import { useSwarmStore } from "@/store/useSwarmStore";

interface AgentStore {
  agents: SwarmAgent[];
  selectedAgent: SwarmAgent | null;
  syncFromSwarm: () => void;
  selectAgent: (agent: SwarmAgent) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: agentsFromStatuses(useSwarmStore.getState().agentStatuses),
  selectedAgent: null,
  syncFromSwarm: () => {
    const statuses = useSwarmStore.getState().agentStatuses;
    set({ agents: agentsFromStatuses(statuses) });
  },
  selectAgent: (agent) => set({ selectedAgent: agent }),
}));
