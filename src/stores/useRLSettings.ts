import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface RLSettingsState {
  isRLEnabled: boolean;
  toggleRLEnabled: () => void;

  // Environment Settings
  isObstaclesEnabled: boolean;
  toggleObstaclesEnabled: () => void;

  isLevelRandom: boolean; // Only relevant when obstacles are enabled - Controls randomness of obstacles
  toggleLevelRandom: () => void;

  simulationSpeed: number; // Speed of the simulation (e.g., 1.0 for normal speed)
  setSimulationSpeed: (speed: number) => void;

  // RL parameters for user tweaking
  learningRate: number; // How fast to learn (0.01 - 0.5)
  setLearningRate: (rate: number) => void;

  discountFactor: number; // How much to value future rewards (0.8 - 0.99)
  setDiscountFactor: (factor: number) => void;

  epsilon: number; // Current exploration rate (0.0 - 1.0)
  setEpsilon: (value: number) => void;

  // Reward values - keeping original names for compatibility
  rewardGoal: number; // Reward for reaching the goal (50 - 200)
  setRewardGoal: (value: number) => void;

  penaltyFall: number; // Penalty for falling off the level (-50 to -5)
  setPenaltyFall: (value: number) => void;

  penaltyWallHit: number; // Penalty for hitting walls (-10 to -1)
  setPenaltyWallHit: (value: number) => void;

  rewardPerTick: number; // Small reward/penalty per step (-0.5 to 0.1)
  setRewardPerTick: (value: number) => void;

  penaltyObstacleHit: number; // Hard-coded penalty (not exposed in UI)

  // Convenience methods
  decayEpsilon: () => void;
  resetEpsilon: () => void;
  resetToDefaults: () => void;

  // Stats for debugging (read-only)
  episodeCount: number;
  incrementEpisode: () => void;
  resetStats: () => void;
}

const useRLSettings = create<RLSettingsState>()(
  subscribeWithSelector((set, get) => ({
    // Manual vs RL settings
    isRLEnabled: false,
    toggleRLEnabled: () =>
      set((state) => ({ isRLEnabled: !state.isRLEnabled })),

    // Environment Settings
    isObstaclesEnabled: false,
    toggleObstaclesEnabled: () =>
      set((state) => ({ isObstaclesEnabled: !state.isObstaclesEnabled })),

    isLevelRandom: true, // Default level obstacles to random
    toggleLevelRandom: () =>
      set((state) => ({ isLevelRandom: !state.isLevelRandom })),

    simulationSpeed: 1.0, // Default simulation speed
    setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

    // RL Parameters
    learningRate: 0.1, // How fast to update Q-values
    setLearningRate: (rate) =>
      set({ learningRate: Math.max(0.01, Math.min(0.5, rate)) }),

    discountFactor: 0.95, // Higher value for longer-term planning
    setDiscountFactor: (factor) =>
      set({ discountFactor: Math.max(0.5, Math.min(0.99, factor)) }),

    epsilon: 1.0, // Start with full exploration
    setEpsilon: (value) =>
      set({ epsilon: Math.max(0.0, Math.min(1.0, value)) }),

    // Reward values - user configurable
    rewardGoal: 100, // Reward for reaching the goal
    setRewardGoal: (value) =>
      set({ rewardGoal: Math.max(10, Math.min(500, value)) }),

    penaltyFall: -10, // Penalty for falling off
    setPenaltyFall: (value) =>
      set({ penaltyFall: Math.max(-50, Math.min(-1, value)) }),

    penaltyWallHit: -2, // Penalty for hitting walls
    setPenaltyWallHit: (value) =>
      set({ penaltyWallHit: Math.max(-10, Math.min(-0.5, value)) }),

    rewardPerTick: -0.1, // Small penalty per step to encourage speed
    setRewardPerTick: (value) =>
      set({ rewardPerTick: Math.max(-0.5, Math.min(0.1, value)) }),

    // Hard-coded penalty (not in UI)
    penaltyObstacleHit: -5,

    // Convenience methods
    decayEpsilon: () => {
      const { epsilon } = get();
      const newEpsilon = Math.max(0.05, epsilon * 0.98); // 0.5% decay per step
      set({ epsilon: newEpsilon });
    },

    resetEpsilon: () => set({ epsilon: 1.0 }),

    resetToDefaults: () =>
      set({
        learningRate: 0.1,
        discountFactor: 0.9,
        epsilon: 1.0,
        rewardGoal: 100,
        penaltyFall: -10,
        penaltyWallHit: -2,
        rewardPerTick: -0.1,
        episodeCount: 0,
      }),

    // Simple stats
    episodeCount: 0,
    incrementEpisode: () =>
      set((state) => ({ episodeCount: state.episodeCount + 1 })),
    resetStats: () => set({ episodeCount: 0 }),
  })),
);

export default useRLSettings;
