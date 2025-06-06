import useRLSettings from "../stores/useRLSettings";
import Keyboard from "./Keyboard";

export default function ControlSettings() {
  // Get RL settings
  const {
    isRLEnabled,
    toggleRLEnabled,
    isLevelRandom,
    toggleLevelRandom,
    learningRate,
    setLearningRate,
    discountFactor,
    setDiscountFactor,
    epsilon,
    setEpsilon,
    epsilonDecay,
    setEpsilonDecay,
    minEpsilon,
    setMinEpsilon,
    rewardGoal,
    setRewardGoal,
    penaltyFall,
    setPenaltyFall,
    penaltyObstacleHit,
    setPenaltyObstacleHit,
    rewardPerTick,
    setRewardPerTick,
  } = useRLSettings();

  return (
    <div className="absolute bottom-1/12 left-4 flex w-full flex-col items-start justify-center gap-4">
      {!isRLEnabled && ( // Only show keyboard controls if RL is off
        <Keyboard />
      )}
      {/* RL Toggle and Settings */}
      <div className="pointer-events-auto w-full max-w-md rounded-lg bg-black/70 p-4 text-white">
        <h3 className="mb-2 text-center text-xl font-bold">RL Settings</h3>

        <div className="mb-2 flex items-center justify-between">
          <span>Enable RL Agent:</span>
          <input
            type="checkbox"
            checked={isRLEnabled}
            onChange={toggleRLEnabled}
            className="h-5 w-5 cursor-pointer accent-purple-500"
          />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span>Random Level Obstacles:</span>
          <input
            type="checkbox"
            checked={isLevelRandom}
            onChange={toggleLevelRandom}
            className="h-5 w-5 cursor-pointer accent-purple-500"
          />
        </div>

        {isRLEnabled && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <h4 className="mb-2 text-lg font-semibold">
              Q-Learning Parameters
            </h4>
            <div className="mb-2 flex items-center justify-between">
              <label>Learning Rate (Alpha):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Discount Factor (Gamma):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={discountFactor}
                onChange={(e) => setDiscountFactor(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Epsilon (Exploration):</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={epsilon}
                onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Epsilon Decay:</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={epsilonDecay}
                onChange={(e) => setEpsilonDecay(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Min Epsilon:</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={minEpsilon}
                onChange={(e) => setMinEpsilon(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>

            <h4 className="mt-4 mb-2 text-lg font-semibold">Reward Values</h4>
            <div className="mb-2 flex items-center justify-between">
              <label>Reward Goal:</label>
              <input
                type="number"
                step="1"
                value={rewardGoal}
                onChange={(e) => setRewardGoal(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Penalty Fall:</label>
              <input
                type="number"
                step="1"
                value={penaltyFall}
                onChange={(e) => setPenaltyFall(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Penalty Obstacle Hit:</label>
              <input
                type="number"
                step="1"
                value={penaltyObstacleHit}
                onChange={(e) =>
                  setPenaltyObstacleHit(parseFloat(e.target.value))
                }
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
            <div className="mb-2 flex items-center justify-between">
              <label>Reward Per Tick:</label>
              <input
                type="number"
                step="0.01"
                value={rewardPerTick}
                onChange={(e) => setRewardPerTick(parseFloat(e.target.value))}
                className="w-20 rounded bg-gray-800 px-2 py-1 text-right text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
