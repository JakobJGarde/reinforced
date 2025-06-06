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

const OBSTACLE_COMPONENTS = [Axe, Limbo, Spinner];

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount);
  const phase = useGame((state) => state.phase);
  const start = useGame((state) => state.start);
  const restart = useGame((state) => state.restart);

  // Get RL settings from the store
  const {
    isRLEnabled,
    isLevelRandom,
    learningRate,
    discountFactor,
    epsilon,
    epsilonDecay,
    minEpsilon,
    rewardGoal,
    penaltyFall,
    penaltyObstacleHit,
    penaltyWallHit,
    rewardPerTick,
  } = useRLSettings();

  // Get the updateStats action from the new RL Stats store
  const addEvent = useRLStats((state) => state.addEvent);
  const updateRLStats = useRLStats((state) => state.updateStats);
  const resetRLStats = useRLStats((state) => state.resetStats);

  // --- RL Agent Setup ---
  const rlAgent = useRef<RLAgent | null>(null);
  const episodeCount = useRef(0);
  const totalReward = useRef(0);
  const lastObservation = useRef<PlayerObservation | null>(null);
  const [currentActionForPlayer, setCurrentActionForPlayer] =
    useState<PlayerAction | null>(null);
  const statsUpdateIntervalId = useRef<NodeJS.Timeout | null>(null);

  // Initialize the agent once, and update its parameters when they change
  useEffect(() => {
    if (!rlAgent.current) {
      rlAgent.current = new RLAgent();
      console.log("RL Agent instance created in Experience.");
    }

    rlAgent.current.learningRate = learningRate;
    rlAgent.current.discountFactor = discountFactor;
    rlAgent.current.epsilon = epsilon;
    rlAgent.current.epsilonDecay = epsilonDecay;
    rlAgent.current.minEpsilon = minEpsilon;
    rlAgent.current.rewards = {
      goal: rewardGoal,
      fall: penaltyFall,
      obstacleHit: penaltyObstacleHit,
      wallHit: penaltyWallHit,
      perTick: rewardPerTick,
    };

    // If RL is enabled and the game is ready, start the first episode
    if (isRLEnabled && phase === "ready") {
      console.log("RL enabled, starting initial episode...");
      start();
    }

    // Setup interval for UI updates
    if (isRLEnabled && !statsUpdateIntervalId.current) {
      statsUpdateIntervalId.current = setInterval(() => {
        if (rlAgent.current) {
          // Get the current observation from Player if available for current Q-values
          const currentObsForUI = lastObservation.current || null; // Use last processed obs
          const currentDiscreteStateKey = currentObsForUI
            ? rlAgent.current.getCurrentDiscreteStateKey(currentObsForUI)
            : null;
          const currentQValues = currentDiscreteStateKey
            ? rlAgent.current.getQValuesForState(currentDiscreteStateKey)
            : undefined;

          updateRLStats(
            episodeCount.current,
            totalReward.current,
            rlAgent.current.getEpsilon(),
            rlAgent.current.getQTableSize(),
            currentDiscreteStateKey,
            currentQValues,
          );
        }
      }, 200);
    } else if (!isRLEnabled && statsUpdateIntervalId.current) {
      // Clear interval and reset stats if RL is disabled
      clearInterval(statsUpdateIntervalId.current);
      statsUpdateIntervalId.current = null;
      resetRLStats();
    }

    // Cleanup interval on unmount or when isRLEnabled changes
    return () => {
      if (statsUpdateIntervalId.current) {
        clearInterval(statsUpdateIntervalId.current);
        statsUpdateIntervalId.current = null;
      }
    };
  }, [
    isRLEnabled,
    phase,
    start,
    learningRate,
    discountFactor,
    epsilon,
    epsilonDecay,
    minEpsilon,
    rewardGoal,
    penaltyFall,
    penaltyObstacleHit,
    penaltyWallHit,
    rewardPerTick,
    updateRLStats,
    resetRLStats,
  ]);

  const handleAgentObserve = (
    observation: PlayerObservation,
    reward: number,
    done: boolean,
  ) => {
    if (!rlAgent.current) return;

    totalReward.current += reward;

    // This block handles the first observation of an episode
    // It's `s` -> `a`
    if (lastObservation.current === null) {
      // Only need to check for previous observation
      lastObservation.current = observation;
      setCurrentActionForPlayer(rlAgent.current.chooseAction(observation));
      return; // Skip learning for the first step as there's no (s,a) yet
    }

    // Agent learns from the (s, a, r, s', done) transition
    // Here, `previousRawObservation.current` is 's' and `currentObservationFromPlayer` is 's'`
    rlAgent.current.learn(
      lastObservation.current, // s
      currentActionForPlayer!, // a
      reward, //                  r
      observation, //             s'
      done, //                    done
    );

    if (done) {
      const outcomeMessage =
        reward > 0
          ? `Goal Reached! Total: ${totalReward.current.toFixed(2)}`
          : `Fallen! Total: ${totalReward.current.toFixed(2)}`;

      addEvent(`Episode ${episodeCount.current} Ended: ${outcomeMessage}`);

      rlAgent.current.reset();
      restart();

      episodeCount.current++;
      totalReward.current = 0;
      lastObservation.current = null;
      setCurrentActionForPlayer(null);
    } else {
      lastObservation.current = observation;
      setCurrentActionForPlayer(rlAgent.current.chooseAction(observation));
    }
  };

  return (
    <>
      <color args={["#bdedfc"]} attach="background" />
      <Physics debug={false}>
        <Lights />
        <Level
          count={blocksCount}
          obstacles={OBSTACLE_COMPONENTS}
          isRandom={isLevelRandom} // Pass randomness control to Level
        />
        <Player
          // Conditionally pass the agent based on isRLEnabled
          agent={isRLEnabled ? rlAgent.current : null}
          onObserve={handleAgentObserve}
          currentActionFromAgent={currentActionForPlayer}
          rewardConfig={{
            rewardGoal,
            penaltyFall,
            penaltyObstacleHit,
            penaltyWallHit,
            rewardPerTick,
          }}
        />
      </Physics>
    </>
  );
}
