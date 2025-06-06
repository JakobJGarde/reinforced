import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRapier, RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import useGame from "../../stores/useGame";
import { type RLSettingsState } from "../../stores/useRLSettings"; // Import the RL settings store

import RLAgent, { type PlayerAction, type PlayerObservation } from "../RLAgent";
import { RAPIER_COLLISION_GROUPS } from "../../utils/constants";
import useRLStats from "../../stores/useRLStats";

interface ColliderUserData {
  type: "obstacle" | "wall" | "ground" | "player" | string;
  name?: string;
}

interface PlayerProps {
  agent?: RLAgent | null;
  onObserve?: (
    observation: PlayerObservation,
    reward: number,
    done: boolean,
  ) => void;
  rewardConfig: Pick<
    RLSettingsState,
    | "rewardGoal"
    | "penaltyFall"
    | "penaltyObstacleHit"
    | "penaltyWallHit"
    | "rewardPerTick"
  >;
  currentActionFromAgent?: PlayerAction | null;
}

export default function Player({
  agent,
  onObserve,
  rewardConfig,
  currentActionFromAgent,
}: PlayerProps) {
  const body = useRef<RapierRigidBody>(null!);
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { rapier, world } = useRapier();
  const [smoothedCameraPostion] = useState(new THREE.Vector3(10, 10, 10));
  const [smoothedCameraTarget] = useState(new THREE.Vector3());

  const start = useGame((state) => state.start);
  const end = useGame((state) => state.end);
  const restart = useGame((state) => state.restart);
  const blocksCount = useGame((state) => state.blocksCount);
  const phase = useGame((state) => state.phase);

  const addEvent = useRLStats((state) => state.addEvent);

  // Collision flags
  const [obstacleHitThisFrame, setObstacleHitThisFrame] = useState(false);
  const [wallHitThisFrame, setWallHitThisFrame] = useState(false);

  // --- Helper Functions for Player Actions ---
  const applyJump = () => {
    const origin = body.current.translation();
    origin.y -= 0.31;
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, 10, true);

    if (hit && hit.timeOfImpact < 0.15) {
      body.current.applyImpulse({ x: 0, y: 0.5, z: 0 }, true);
      return true;
    }
    return false;
  };

  const applyMovement = (
    forward: boolean,
    backward: boolean,
    left: boolean,
    right: boolean,
    delta: number,
  ) => {
    const impulse = { x: 0, y: 0, z: 0 };
    const torque = { x: 0, y: 0, z: 0 };

    const impulseStrength = 0.6 * delta;
    const torqueStrength = 0.2 * delta;

    if (forward) {
      impulse.z -= impulseStrength;
      torque.x -= torqueStrength;
    }
    if (right) {
      impulse.x += impulseStrength;
      torque.z -= torqueStrength;
    }
    if (backward) {
      impulse.z += impulseStrength;
      torque.x += torqueStrength;
    }
    if (left) {
      impulse.x -= impulseStrength;
      torque.z += torqueStrength;
    }

    body.current.applyImpulse(impulse, true);
    body.current.applyTorqueImpulse(torque, true);
  };

  const resetPlayer = () => {
    body.current.setTranslation({ x: 0, y: 1, z: 0 }, true);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    setObstacleHitThisFrame(false);
    setWallHitThisFrame(false);
  };

  // --- Effect Hooks ---
  useEffect(() => {
    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (phase) => {
        if (phase === "ready") resetPlayer();
      },
    );

    let unsubscribeJump: () => void = () => {};
    let unsubscribeAny: () => void = () => {};

    if (!agent) {
      // Only subscribe to keyboard if no agent is controlling
      unsubscribeJump = subscribeKeys(
        (state) => state.jump,
        (value) => {
          if (value) applyJump();
        },
      );
      unsubscribeAny = subscribeKeys(() => {
        start();
      });
    }

    return () => {
      unsubscribeReset();
      unsubscribeJump();
      unsubscribeAny();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, start]);

  // --- Collision Handler ---
  const handleCollisionEnter = (payload: {
    other: { rigidBody?: RapierRigidBody | null };
  }) => {
    const otherBody = payload.other.rigidBody;
    if (!otherBody) return;

    const otherBodyData = otherBody.userData as ColliderUserData;

    switch (otherBodyData?.type) {
      case "obstacle":
        setObstacleHitThisFrame(true);
        addEvent(`Obstacle Collision: ${rewardConfig.penaltyObstacleHit}`);
        break;
      case "wall":
        setWallHitThisFrame(true);
        addEvent(`Wall Collision: ${rewardConfig.penaltyObstacleHit}`);
        break;
      case "ground":
        break;
      default:
        break;
    }
  };

  useFrame((state, delta) => {
    // Calculate current frame's immediate reward (per-tick, collisions)
    let currentFrameReward = rewardConfig.rewardPerTick;

    if (obstacleHitThisFrame) {
      currentFrameReward += rewardConfig.penaltyObstacleHit;
      setObstacleHitThisFrame(false);
    }

    if (wallHitThisFrame) {
      currentFrameReward += rewardConfig.penaltyWallHit;
      setWallHitThisFrame(false);
    }

    // --- Agent Control Logic ---
    if (agent && phase === "playing") {
      const currentObservation = getObservation(); // Get the observation *after* physics step

      // Report current observation, reward, and done status to Experience
      // Experience will use this to call agent.learn and then decide the next action
      if (onObserve) {
        onObserve(currentObservation, currentFrameReward, false); // `false` for non-terminal steps
      }

      // Agent chooses action based on current observation
      switch (currentActionFromAgent) {
        case "forward":
          applyMovement(true, false, false, false, delta);
          break;
        case "backward":
          applyMovement(false, true, false, false, delta);
          break;
        case "jump":
          applyJump();
          break;
        case "none":
          /* do nothing, let physics handle it */ break;
        default:
          break;
      }
    } else if (!agent) {
      // Keyboard control
      const { forward, backward, left, right } = getKeys();
      applyMovement(forward, backward, left, right, delta);
    }

    /**
     * Camera (unaffected)
     */
    const bodyPosition = body.current.translation();
    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(bodyPosition);
    cameraPosition.z += 2.25;
    cameraPosition.y += 0.65;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    smoothedCameraPostion.lerp(cameraPosition, 5 * delta);
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta);

    state.camera.position.copy(smoothedCameraPostion);
    state.camera.lookAt(smoothedCameraTarget);

    /**
     * Phases - Game End Conditions (mostly unaffected, but ensure onObserve is called correctly)
     */
    const isPlayerAtEnd = bodyPosition.z < -(blocksCount * 4 + 2);
    const isPlayerFallen = bodyPosition.y < -4;

    if (isPlayerAtEnd && phase !== "ended") {
      end();
      // Inform Experience about the terminal state
      if (onObserve) {
        onObserve(getObservation(), rewardConfig.rewardGoal, true);
      }
    } else if (isPlayerFallen && phase !== "ended") {
      restart();
      // Inform Experience about the terminal state
      if (onObserve) {
        onObserve(getObservation(), rewardConfig.penaltyFall, true);
      }
    }
  });

  // --- RL Specific Functions ---
  const getObservation = (): PlayerObservation => {
    const playerPosition = body.current.translation();
    const playerVelocity = body.current.linvel();

    const endZ = -(blocksCount * 4 + 2);
    const distanceToEnd = Math.max(0, playerPosition.z - endZ);

    return {
      player_x: playerPosition.x,
      player_y: playerPosition.y,
      vel_x: playerVelocity.x,
      vel_y: playerVelocity.y,
      vel_z: playerVelocity.z,
      distance_to_end: distanceToEnd, // Now explicitly included
    };
  };

  return (
    <RigidBody
      ref={body}
      canSleep={false}
      colliders="ball"
      restitution={0.2}
      friction={1}
      linearDamping={0.5}
      angularDamping={0.5}
      position={[0, 1, 0]}
      onCollisionEnter={handleCollisionEnter}
      collisionGroups={
        (RAPIER_COLLISION_GROUPS.PLAYER << 16) |
        (RAPIER_COLLISION_GROUPS.OBSTACLE |
          RAPIER_COLLISION_GROUPS.GROUND |
          RAPIER_COLLISION_GROUPS.WALL)
      }
    >
      <mesh castShadow>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial flatShading color="mediumpurple" />
      </mesh>
    </RigidBody>
  );
}
