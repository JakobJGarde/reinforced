import { addEffect } from "@react-three/fiber";
import { useEffect, useState } from "react";

import useGame from "../stores/useGame";
import {
  IoPauseSharp,
  IoPlayBackSharp,
  IoPlayForwardSharp,
  IoPlaySharp,
} from "react-icons/io5";

const formatTime = (totalMilliseconds: number) => {
  const minutes = Math.floor(totalMilliseconds / (1000 * 60));
  const seconds = Math.floor((totalMilliseconds % (1000 * 60)) / 1000);
  const ms = Math.floor((totalMilliseconds % 1000) / 10);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  const formattedMs = String(ms).padStart(2, "0");

  return { formattedMinutes, formattedSeconds, formattedMs };
};

export default function Timer() {
  const [displayTime, setDisplayTime] = useState({
    formattedMinutes: "00",
    formattedSeconds: "00",
    formattedMs: "00",
  });

  const isActive = useGame((state) => state.isActive);
  const setIsActive = useGame((state) => state.setIsActive);
  const simulationSpeed = useGame((state) => state.simulationSpeed);
  const setSimulationSpeed = useGame((state) => state.setSimulationSpeed);

  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      const state = useGame.getState();
      let elapsedTime = 0;

      if (state.phase === "playing") {
        const realElapsedTime = Date.now() - state.startTime;
        elapsedTime = realElapsedTime * state.simulationSpeed;
      } else if (state.phase === "ended") {
        const realDurationAtEnd = state.endTime - state.startTime;
        elapsedTime = realDurationAtEnd * state.simulationSpeed;
      }

      setDisplayTime(formatTime(elapsedTime));
    });

    return () => {
      // Cleanup
      unsubscribeEffect();
    };
  }, []);

  return (
    <div className="flex h-fit flex-col items-center gap-2 rounded-lg border-2 border-gray-200/30 bg-gray-700/30 px-4 py-2 backdrop-blur-md [&>*]:divide-gray-900/60 [&>*]:border-gray-900/60">
      <div className="font-dseg14 relative rounded-lg border-2 bg-gradient-to-tr from-gray-900/70 from-20% to-gray-800/50 to-90% bg-clip-padding p-4 text-right text-4xl font-light italic text-shadow-2xs">
        <span className="absolute inset-0 p-4 text-right">
          {displayTime.formattedMinutes}:{displayTime.formattedSeconds}
          <span className="ml-1 text-xl">{displayTime.formattedMs}</span>
        </span>
        <span className="text-purple-300/30">
          ~~:~~
          <span className="ml-1 text-xl">~~</span>
        </span>
      </div>
      <div className="pointer-events-auto grid cursor-pointer grid-flow-col items-center justify-items-center divide-x-2 rounded-lg border-2 text-2xl [&>*]:bg-clip-padding [&>*]:px-3">
        <div
          className="flex h-full items-center justify-center bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
          onClick={() => setIsActive(!isActive)}
        >
          {isActive ? <IoPlaySharp /> : <IoPauseSharp />}
        </div>
        <div
          className="flex h-full items-center justify-center bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
          onClick={() =>
            setSimulationSpeed(Math.max(0.5, simulationSpeed - 0.5))
          }
        >
          <IoPlayBackSharp />
        </div>
        <div className="font-dseg14 relative bg-gradient-to-tr from-gray-900/70 from-20% to-gray-800/50 to-90% p-2">
          <span className="absolute inset-0 p-2 text-right">
            {simulationSpeed.toFixed(1)}
          </span>
          <span className="text-purple-300/30">~~.~</span>
        </div>
        <div
          className="flex h-full items-center justify-center bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
          onClick={() => setSimulationSpeed(simulationSpeed + 0.5)}
        >
          <IoPlayForwardSharp />
        </div>
      </div>
    </div>
  );
}
