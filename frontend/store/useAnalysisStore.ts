import { create } from "zustand";
import { Insight } from "@/types";
import { getInsightsFromRun } from "@/services/analysis.service";

interface AnalysisStore {
  insights: Insight[];
  syncFromSwarm: () => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  insights: getInsightsFromRun(),
  syncFromSwarm: () => set({ insights: getInsightsFromRun() }),
}));
