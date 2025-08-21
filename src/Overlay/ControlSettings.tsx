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
      <div className="pointer-events-auto grid cursor-pointer grid-flow-row items-center justify-items-center divide-y-2 rounded-lg border-2 text-2xl [&>*]:bg-clip-padding [&>*]:p-3">
        <div
          className="flex h-full items-center justify-center bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
          onClick={toggleRLEnabled}
        >
          {isRLEnabled ? <MdAutoAwesome /> : <FaRegKeyboard />}
        </div>
        <div
          className="flex h-full items-center justify-center bg-gradient-to-tr from-gray-800/50 from-20% to-purple-700/30 to-90% transition-colors duration-300 hover:bg-gradient-to-tr hover:from-gray-900/70 hover:to-purple-700/50"
          onClick={toggleObstaclesEnabled}
        >
          {isObstaclesEnabled ? <FaExplosion /> : <FaRoad />}
        </div>
      </div>
    </div>
  );
}
