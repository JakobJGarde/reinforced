import { FaExplosion, FaRoad } from "react-icons/fa6";
import useRLSettings from "../stores/useRLSettings";
import { FaRegKeyboard } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";

export default function ControlSettings() {
  // Get RL settings
  const {
    isRLEnabled,
    toggleRLEnabled,
    isObstaclesEnabled,
    toggleObstaclesEnabled,
  } = useRLSettings();

  return (
    <div className="flex h-fit flex-col items-center gap-2 rounded-lg border-2 border-gray-200/30 bg-gray-700/30 px-4 py-2 backdrop-blur-md [&>*]:divide-gray-900/60 [&>*]:border-gray-900/60">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <div
            className="pointer-events-auto flex h-full cursor-pointer items-center justify-center rounded-lg border-2 border-purple-800/30 bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% p-3 text-2xl transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
            onClick={toggleRLEnabled}
          >
            {isRLEnabled ? <FaRegKeyboard /> : <MdAutoAwesome />}
          </div>
          <div>Toggle RL/Manual</div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="pointer-events-auto flex h-full cursor-pointer items-center justify-center rounded-lg border-2 border-purple-800/30 bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% p-3 text-2xl transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
            onClick={toggleObstaclesEnabled}
          >
            {isObstaclesEnabled ? <FaRoad /> : <FaExplosion />}
          </div>
          <div>Toggle Obstacles</div>
        </div>
      </div>
    </div>
  );
}
