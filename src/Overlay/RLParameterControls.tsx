// components/RLParameterControls.tsx
import { useState } from "react";
import useRLSettings from "../stores/useRLSettings";

export default function RLParameterControls() {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    isRLEnabled,
    learningRate,
    setLearningRate,
    discountFactor,
    setDiscountFactor,
    epsilon,
    setEpsilon,
    rewardGoal,
    setRewardGoal,
    penaltyFall,
    setPenaltyFall,
    penaltyWallHit,
    setPenaltyWallHit,
    rewardPerTick,
    setRewardPerTick,
    resetToDefaults,
  } = useRLSettings();

  // Lock inputs when RL is running
  const isLocked = isRLEnabled;

  return (
    <div
      className={`fixed bottom-0 left-4 transition-transform duration-300 ease-in-out ${
        isExpanded ? "" : "translate-y-[calc(100%-3rem)]"
      }`}
    >
      <div className="flex h-fit min-w-80 flex-col divide-y-2 divide-gray-200/30 overflow-hidden rounded-t-lg border-2 border-b-0 border-gray-200/30 bg-gray-700/30 text-white backdrop-blur-md">
        {/* Toggleable Header */}
        <div
          className={`pointer-events-auto flex cursor-pointer items-center justify-between bg-gray-600/30 px-3 py-2 text-lg font-bold transition-colors hover:bg-gray-600/50 ${
            isLocked ? "opacity-75" : ""
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>RL Parameters</span>
          <span
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          >
            ▲
          </span>
        </div>

        {/* Content - only show when expanded */}
        {isExpanded && (
          <>
            {/* Lock notification */}
            {isLocked && (
              <div className="border-b border-gray-200/30 bg-yellow-600/20 px-3 py-2 text-sm text-yellow-200">
                Parameters locked during RL training
              </div>
            )}

            {/* Learning Parameters - Sliders */}
            <div
              className={`space-y-4 px-3 py-3 ${isLocked ? "pointer-events-none opacity-50" : "pointer-events-auto"}`}
            >
              {/* Learning Rate */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Learning Rate (α)
                  </label>
                  <span className="rounded bg-gray-600/50 px-2 py-1 text-xs">
                    {learningRate.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.5"
                  step="0.01"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  disabled={isLocked}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300/50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs">
                  <span>0.01</span>
                  <span>0.50</span>
                </div>
              </div>

              {/* Discount Factor */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Discount Factor (γ)
                  </label>
                  <span className="rounded bg-gray-600/50 px-2 py-1 text-xs">
                    {discountFactor.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.99"
                  step="0.01"
                  value={discountFactor}
                  onChange={(e) =>
                    setDiscountFactor(parseFloat(e.target.value))
                  }
                  disabled={isLocked}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300/50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs">
                  <span>0.50</span>
                  <span>0.99</span>
                </div>
              </div>

              {/* Exploration Rate */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Exploration Rate (ε)
                  </label>
                  <span className="bg-gray-300/50/50 rounded px-2 py-1 text-xs">
                    {epsilon.toFixed(3)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={epsilon}
                  onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                  disabled={isLocked}
                  className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300/50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-xs">
                  <span>0.00</span>
                  <span>1.00</span>
                </div>
              </div>
            </div>

            {/* Reward/Penalty Values - Number Inputs */}
            <div
              className={`px-3 py-3 ${isLocked ? "pointer-events-none opacity-50" : "pointer-events-auto"}`}
            >
              <div className="mb-2 text-sm font-medium">
                Rewards & Penalties
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Goal Reward */}
                <div className="space-y-1">
                  <label className="text-xs">Goal Reward</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={rewardGoal}
                    onChange={(e) =>
                      setRewardGoal(parseInt(e.target.value) || 100)
                    }
                    disabled={isLocked}
                    className="w-full rounded border border-gray-500/50 bg-gray-600/50 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75"
                  />
                </div>

                {/* Fall Penalty */}
                <div className="space-y-1">
                  <label className="text-xs">Fall Penalty</label>
                  <input
                    type="number"
                    min="-50"
                    max="-1"
                    value={penaltyFall}
                    onChange={(e) =>
                      setPenaltyFall(parseInt(e.target.value) || -10)
                    }
                    disabled={isLocked}
                    className="w-full rounded border border-gray-500/50 bg-gray-600/50 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75"
                  />
                </div>

                {/* Wall Hit Penalty */}
                <div className="space-y-1">
                  <label className="text-xs">Wall Hit Penalty</label>
                  <input
                    type="number"
                    min="-10"
                    max="-0.5"
                    step="0.1"
                    value={penaltyWallHit}
                    onChange={(e) =>
                      setPenaltyWallHit(parseFloat(e.target.value) || -2)
                    }
                    disabled={isLocked}
                    className="w-full rounded border border-gray-500/50 bg-gray-600/50 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75"
                  />
                </div>

                {/* Per Tick Reward */}
                <div className="space-y-1">
                  <label className="text-xs">Per Step Penalty</label>
                  <input
                    type="number"
                    min="-0.5"
                    max="0.1"
                    step="0.01"
                    value={rewardPerTick}
                    onChange={(e) =>
                      setRewardPerTick(parseFloat(e.target.value) || -0.1)
                    }
                    disabled={isLocked}
                    className="w-full rounded border border-gray-500/50 bg-gray-600/50 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div
              className={`bg-gray-600/20 px-3 py-2 ${isLocked ? "pointer-events-none opacity-50" : "pointer-events-auto"}`}
            >
              <button
                onClick={resetToDefaults}
                disabled={isLocked}
                className="w-full rounded bg-purple-700/30 px-3 py-1 text-sm text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-75"
              >
                Reset to Defaults
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
