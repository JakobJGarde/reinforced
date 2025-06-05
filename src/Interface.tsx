import { useKeyboardControls } from "@react-three/drei";
import useGame from "./stores/useGame";
import { useEffect, useRef } from "react";
import { addEffect } from "@react-three/fiber";

export default function Interface() {
  const forward = useKeyboardControls((state) => state.forward);
  const right = useKeyboardControls((state) => state.right);
  const backward = useKeyboardControls((state) => state.backward);
  const left = useKeyboardControls((state) => state.left);
  const jump = useKeyboardControls((state) => state.jump);

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

      {/* Controls */}
      <div className="absolute bottom-1/12 left-0 w-full">
        <div className="flex justify-center">
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${forward ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <div className="flex justify-center">
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${left ? "opacity-100" : "opacity-50"}`}
          />
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${backward ? "opacity-100" : "opacity-50"}`}
          />
          <div
            className={`m-1 aspect-square w-10 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${right ? "opacity-100" : "opacity-50"}`}
          />
        </div>
        <div className="flex justify-center">
          <div
            className={`m-1 h-10 w-34 rounded-md border-2 border-white bg-violet-300 transition-opacity duration-100 ${jump ? "opacity-100" : "opacity-50"}`}
          />
        </div>
      </div>
    </div>
  );
}
