import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type AgentStateKey } from "../Experience/RLAgent";

interface RLStatsState {
  // Episode-level stats
  episodeCount: number;
  totalReward: number;

  // Agent-specific stats
  epsilon: number;
  qTableSize: number;
  currentDiscreteStateKey: AgentStateKey | null;
  currentQValues: number[] | undefined;
  qTableSnapshot: Array<{ state: AgentStateKey; qValues: number[] }>; // Array of top N states
  eventLog: string[];

  // Actions to update the state
  updateStats: (
    episodeCount: number,
    totalReward: number,
    epsilon: number,
    qTableSize: number,
    currentDiscreteStateKey: AgentStateKey | null,
    currentQValues: number[] | undefined,
  ) => void;

  addEvent: (message: string) => void;

  resetStats: () => void;
}

const initialState: RLStatsState = {
  episodeCount: 0,
  totalReward: 0,
  epsilon: 0,
  qTableSize: 0,
  currentDiscreteStateKey: null,
  currentQValues: undefined,
  qTableSnapshot: [],
  eventLog: [],
  updateStats: () => {},
  addEvent: () => {},
  resetStats: () => {},
};

const useRLStats = create<RLStatsState>()(
  subscribeWithSelector((set) => ({
    ...initialState, // Set initial state

    updateStats: (
      episodeCount,
      totalReward,
      epsilon,
      qTableSize,
      currentDiscreteStateKey,
      currentQValues,
    ) => {
      set({
        episodeCount,
        totalReward,
        epsilon,
        qTableSize,
        currentDiscreteStateKey,
        currentQValues,
      });
    },

    addEvent: (message: string) => {
      set((state) => {
        const newLog = [...state.eventLog, message];
        return { eventLog: newLog };
      });
    },

    resetStats: () => set(initialState),
  })),
);

export default useRLStats;
