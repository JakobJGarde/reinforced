import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface GameState {
  blocksCount: number;
  blocksSeed: number;
  startTime: number;
  endTime: number;
  gameTimeAccumulated: number;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;

  phase: "ready" | "playing" | "ended";

  start: () => void;
  restart: () => void;
  end: () => void;
}

const useGame = create<GameState>()(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 3,
      blocksSeed: 0,

      /**
       * Timer
       */
      startTime: 0,
      endTime: 0,
      gameTimeAccumulated: 0,
      simulationSpeed: 1.0, // Default simulation speed
      setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
      isActive: true,
      setIsActive: (active) => set({ isActive: active }),

      /**
       * Phases
       */
      phase: "ready", // Starting phase
      start: () => {
        set((state) => {
          if (state.phase === "ready")
            return { phase: "playing", startTime: Date.now() };
          return {};
        });
      },
      restart: () => {
        set((state) => {
          if (state.phase === "playing" || state.phase === "ended")
            return { phase: "ready", blocksSeed: Math.random() };
          return {};
        });
      },
      end: () => {
        set((state) => {
          if (state.phase === "playing")
            return { phase: "ended", endTime: Date.now() };
          return {};
        });
      },
    };
  }),
);

export default useGame;
