// src/stores/useRLSettings.ts
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface RLSettingsState {
  isRLEnabled: boolean;
  isLevelRandom: boolean; // Controls randomness of obstacles
  learningRate: number; // Alpha (e.g., 0.1)
  discountFactor: number; // Gamma (e.g., 0.95)
  epsilon: number; // For exploration (e.g., 1.0)
  epsilonDecay: number; // Decay rate per step/episode (e.g., 0.001)
  minEpsilon: number; // Minimum epsilon value (e.g., 0.01)

  // Reward/Penalty values (you'll need to use these in Player.tsx's calculateReward)
  rewardGoal: number; // Reward for reaching the end
  penaltyFall: number; // Penalty for falling off
  penaltyObstacleHit: number; // Penalty for hitting an obstacle (requires collision detection)
  penaltyWallHit: number; // Penalty for hitting a wall (if applicable)
  rewardPerTick: number; // Small negative reward to encourage faster completion

  toggleRLEnabled: () => void;
  toggleLevelRandom: () => void;
  setLearningRate: (rate: number) => void;
  setDiscountFactor: (factor: number) => void;
  setEpsilon: (value: number) => void;
  setEpsilonDecay: (value: number) => void;
  setMinEpsilon: (value: number) => void;
  setRewardGoal: (value: number) => void;
  setPenaltyFall: (value: number) => void;
  setPenaltyObstacleHit: (value: number) => void;
  setPenaltyWallHit: (value: number) => void; // Add this if you implement wall collisions
  setRewardPerTick: (value: number) => void;
}

const useRLSettings = create<RLSettingsState>()(
  subscribeWithSelector((set) => ({
    isRLEnabled: false, // Default to off
    isLevelRandom: true, // Default level obstacles to random
    learningRate: 0.1,
    discountFactor: 0.95,
    epsilon: 1.0,
    epsilonDecay: 0.0001, // A bit lower decay
    minEpsilon: 0.01,

    rewardGoal: 100,
    penaltyFall: -50,
    penaltyObstacleHit: -10,
    penaltyWallHit: -5,
    rewardPerTick: -0.01,

    toggleRLEnabled: () =>
      set((state) => ({ isRLEnabled: !state.isRLEnabled })),
    toggleLevelRandom: () =>
      set((state) => ({ isLevelRandom: !state.isLevelRandom })),
    setLearningRate: (rate) => set({ learningRate: rate }),
    setDiscountFactor: (factor) => set({ discountFactor: factor }),
    setEpsilon: (value) => set({ epsilon: value }),
    setEpsilonDecay: (value) => set({ epsilonDecay: value }),
    setMinEpsilon: (value) => set({ minEpsilon: value }),
    setRewardGoal: (value) => set({ rewardGoal: value }),
    setPenaltyFall: (value) => set({ penaltyFall: value }),
    setPenaltyObstacleHit: (value) => set({ penaltyObstacleHit: value }),
    setPenaltyWallHit: (value) => set({ penaltyWallHit: value }),
    setRewardPerTick: (value) => set({ rewardPerTick: value }),
  })),
);

export default useRLSettings;
