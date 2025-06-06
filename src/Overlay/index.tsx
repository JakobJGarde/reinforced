import useGame from "../stores/useGame";
import { useEffect, useRef } from "react";
import { addEffect } from "@react-three/fiber";
import ControlSettings from "./ControlSettings";
import RLDebugger from "./RLDebugger";

export default function Overlay() {
  const restart = useGame((state) => state.restart);
  const phase = useGame((state) => state.phase);
  const time = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      const state = useGame.getState();
      let elapsedTime = 0;
      if (state.phase === "playing") {
        elapsedTime = Date.now() - state.startTime;
      } else if (state.phase === "ended") {
        elapsedTime = state.endTime - state.startTime;
      }
      elapsedTime /= 1000;

      if (time.current) {
        time.current.textContent = elapsedTime.toFixed(2);
      }
    });
    return () => {
      // Cleanup
      unsubscribeEffect();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-0 left-0 h-screen w-full">
      {/* Time */}
      <div
        ref={time}
        className="absolute top-1/5 left-0 w-full bg-black/50 py-4 text-center text-4xl text-white"
      >
        0.00
      </div>

      {/* Restart */}
      {phase === "ended" && (
        <div
          className="pointer-events-auto absolute top-2/5 left-0 flex w-full cursor-pointer justify-center bg-black/50 py-4 text-6xl text-white"
          onClick={restart}
        >
          Restart
        </div>
      )}
      <ControlSettings />
      <RLDebugger />
    </div>
  );
}
