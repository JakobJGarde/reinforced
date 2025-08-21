import { Physics } from "@react-three/rapier";
import { useRef, useEffect, useState } from "react";
import Lights from "./Lights";
import Level from "./Level";
import Player from "./Player";
import useGame from "../stores/useGame";
import useRLSettings from "../stores/useRLSettings";
import useRLStats from "../stores/useRLStats";
import RLAgent, { type PlayerAction, type PlayerObservation } from "./RLAgent";
import Axe from "./obstacles/Axe";
import Limbo from "./obstacles/Limbo";
import Spinner from "./obstacles/Spinner";
import { rlDataExporter, createQTableSnapshot } from "../utils/rlDataExporter";

const OBSTACLE_COMPONENTS = [Axe, Limbo, Spinner];

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const blocksSeed = useGame((state) => state.blocksSeed);
  const phase = useGame((state) => state.phase);
  const start = useGame((state) => state.start);
  const restart = useGame((state) => state.restart);

  // Get simplified RL settings
  const {
    isRLEnabled,
    learningRate,
    discountFactor,
    epsilon,
    rewardGoal,
    penaltyFall,
    penaltyWallHit,
    rewardPerTick,
    penaltyObstacleHit, // Still hard-coded but accessible
    decayEpsilon,
    incrementEpisode,
  } = useRLSettings();

  // RL Stats for UI
  const updateRLStats = useRLStats((state) => state.updateStats);
  const addEvent = useRLStats((state) => state.addEvent);
  const resetRLStats = useRLStats((state) => state.resetStats);

  // --- RL Agent Setup ---
  const rlAgent = useRef<RLAgent | null>(null);
  const episodeCount = useRef(0);
  const totalReward = useRef(0);
  const lastObservation = useRef<PlayerObservation | null>(null);
  const [currentActionForPlayer, setCurrentActionForPlayer] =
    useState<PlayerAction | null>(null);
  const statsUpdateIntervalId = useRef<NodeJS.Timeout | null>(null);

  // Data recording refs
  const stateVisitCounts = useRef<Map<string, number>>(new Map());
  const currentEpisodeSteps = useRef(0);
  const episodeStartTime = useRef(0);

  // Initialize the agent once
  useEffect(() => {
    if (!rlAgent.current) {
      rlAgent.current = new RLAgent();
      console.log("RL Agent created");
    }

    // Auto-start/stop data recording with RL toggle
    if (isRLEnabled && !rlDataExporter.isCurrentlyRecording()) {
      const parameters = {
        learningRate,
        discountFactor,
        initialEpsilon: epsilon,
        rewardGoal,
        penaltyFall,
        penaltyWallHit,
        rewardPerTick,
      };
      rlDataExporter.startRecording(parameters);

      // Reset tracking data for new session
      stateVisitCounts.current.clear();
      episodeCount.current = 0;
    } else if (!isRLEnabled && rlDataExporter.isCurrentlyRecording()) {
      // Stop recording and export final Q-table
      if (rlAgent.current) {
        const qTableSnapshot = createQTableSnapshot(
          rlAgent.current,
          stateVisitCounts.current,
        );
        rlDataExporter.finishRecording(qTableSnapshot, epsilon);
      }
    }

    // Auto-start first episode when RL is enabled
    if (isRLEnabled && phase === "ready") {
      console.log("Starting RL training...");
      start();
    }

    // Setup stats update interval
    if (isRLEnabled && !statsUpdateIntervalId.current) {
      statsUpdateIntervalId.current = setInterval(() => {
        if (rlAgent.current && lastObservation.current) {
          const currentStateKey = rlAgent.current.getCurrentDiscreteStateKey(
            lastObservation.current,
          );
          const currentQValues =
            rlAgent.current.getQValuesForState(currentStateKey);

          updateRLStats(
            episodeCount.current,
            totalReward.current,
            epsilon,
            rlAgent.current.getQTableSize(),
            currentStateKey,
            currentQValues,
          );
        }
      }, 200);
    } else if (!isRLEnabled && statsUpdateIntervalId.current) {
      clearInterval(statsUpdateIntervalId.current);
      statsUpdateIntervalId.current = null;
      resetRLStats();
    }

    return () => {
      if (statsUpdateIntervalId.current) {
        clearInterval(statsUpdateIntervalId.current);
        statsUpdateIntervalId.current = null;
      }
      // Don't auto-stop recording on unmount - let user control it
    };
  }, [
    isRLEnabled,
    phase,
    start,
    epsilon,
    updateRLStats,
    resetRLStats,
    learningRate,
    discountFactor,
    rewardGoal,
    penaltyFall,
    penaltyWallHit,
    rewardPerTick,
  ]);

  const handleAgentObserve = (
    observation: PlayerObservation,
    reward: number,
    done: boolean,
  ) => {
    if (!rlAgent.current || !isRLEnabled) return;

    totalReward.current += reward;
    currentEpisodeSteps.current++;

    // Record state visit for analytics
    if (lastObservation.current) {
      const stateKey = rlAgent.current.getCurrentDiscreteStateKey(
        lastObservation.current,
      );
      const visits = stateVisitCounts.current.get(stateKey) || 0;
      stateVisitCounts.current.set(stateKey, visits + 1);
    }

    // First observation of episode - just choose action
    if (lastObservation.current === null) {
      lastObservation.current = observation;
      episodeStartTime.current = Date.now();
      currentEpisodeSteps.current = 0;
      const action = rlAgent.current.chooseAction(observation, epsilon);
      setCurrentActionForPlayer(action);
      return;
    }

    // Record step data if recording
    if (rlDataExporter.isCurrentlyRecording()) {
      const stateKey = rlAgent.current.getCurrentDiscreteStateKey(
        lastObservation.current,
      );
      const qValues = rlAgent.current.getQValuesForState(stateKey) || [];

      rlDataExporter.recordStep({
        episodeNumber: episodeCount.current,
        stepNumber: currentEpisodeSteps.current,
        state: stateKey,
        action: currentActionForPlayer!,
        reward: reward,
        observation: lastObservation.current,
        qValues: [...qValues],
        epsilon: epsilon,
        timestamp: Date.now(),
      });
    }

    // Learn from the transition: (s, a, r, s', done)
    rlAgent.current.learn(
      lastObservation.current, // previous state
      currentActionForPlayer!, // action taken
      reward, // reward received
      observation, // new state
      done, // episode finished?
      learningRate,
      discountFactor,
    );

    if (done) {
      // Determine outcome
      let outcome: "goal" | "fall" | "timeout" = "fall";
      if (reward > 50) outcome = "goal";
      else if (currentEpisodeSteps.current > 1000) outcome = "timeout";

      // Record episode data if recording
      if (rlDataExporter.isCurrentlyRecording()) {
        rlDataExporter.recordEpisode({
          episodeNumber: episodeCount.current,
          totalReward: totalReward.current,
          steps: currentEpisodeSteps.current,
          outcome: outcome,
          finalDistance: observation.distance_to_end,
          epsilon: epsilon,
          timestamp: Date.now(),
        });
      }

      const outcomeMessage =
        outcome === "goal"
          ? `🎯 Goal! Reward: ${totalReward.current.toFixed(1)}`
          : `💀 Failed! Reward: ${totalReward.current.toFixed(1)}`;

      addEvent(`Episode ${episodeCount.current + 1}: ${outcomeMessage}`);

      // Update episode count in store and local ref
      incrementEpisode();
      episodeCount.current++;

      // Decay exploration
      decayEpsilon();

      // Reset for next episode
      totalReward.current = 0;
      lastObservation.current = null;
      setCurrentActionForPlayer(null);
      currentEpisodeSteps.current = 0;

      // Auto-restart next episode
      setTimeout(() => restart(), 100);
    } else {
      // Continue episode - choose next action
      lastObservation.current = observation;
      const nextAction = rlAgent.current.chooseAction(observation, epsilon);
      setCurrentActionForPlayer(nextAction);
    }
  };

  // Create reward config using values from Zustand store
  const rewardConfig = {
    rewardGoal,
    penaltyFall,
    penaltyObstacleHit,
    penaltyWallHit,
    rewardPerTick,
  };

  return (
    <>
      <color
        args={isRLEnabled ? ["#e6f3ff"] : ["#ffffff"]}
        attach="background"
      />
      <Physics debug={false}>
        <Lights />
        <Level
          count={blocksCount}
          obstacles={OBSTACLE_COMPONENTS}
          seed={blocksSeed}
          isRandom={false} // Disable randomness for consistent learning
        />
        <Player
          agent={isRLEnabled ? rlAgent.current : null}
          onObserve={handleAgentObserve}
          currentActionFromAgent={currentActionForPlayer}
          rewardConfig={rewardConfig}
        />
      </Physics>
    </>
  );
}
