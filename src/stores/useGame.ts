import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export interface GameState {
  blocksCount: number;
  startTime: number;
  endTime: number;
  phase: "ready" | "playing" | "ended";
  start: () => void;
  restart: () => void;
  end: () => void;
}

const useGame = create<GameState>()(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 3,

      /**
       * Timer
       */
      startTime: 0,
      endTime: 0,

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
            return { phase: "ready" };
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
