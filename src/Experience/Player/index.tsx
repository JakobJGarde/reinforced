import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRapier, RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import useGame from "../../stores/useGame";
import { type RLSettingsState } from "../../stores/useRLSettings";

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
  simulationSpeed?: number;
}

// Define base magnitudes for movement and jump.
// These values represent the force/impulse per unit of 'game time' at 1x speed.
// We'll scale them by 'scaledDelta' in useFrame.
const MOVEMENT_FORCE_MAGNITUDE = 2.0; // Adjust this value to control how strong horizontal movement feels
const JUMP_IMPULSE_MAGNITUDE = 0.2; // Adjust this value to control jump height
const TORQUE_FORCE_MAGNITUDE = 1.0; // Adjust this value to control how fast the player rotates

export default function Player({
  agent,
  onObserve,
  rewardConfig,
  currentActionFromAgent,
  simulationSpeed = 1.0, // Default to normal speed
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
  // These functions now receive 'scaledDelta' (or use fixed magnitudes for impulses)
  const applyJump = () => {
    const origin = body.current.translation();
    origin.y -= 0.31; // Slightly below player's center
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    // Cast ray to check for ground contact within a small distance
    const hit = world.castRay(ray, 0.15, true);

    if (hit && hit.collider && hit.timeOfImpact < 0.15) {
      // Apply a fixed impulse for jumping. The overall 'jump height' will
      // be affected by the faster physics timeStep set in <Physics>.
      body.current.applyImpulse(
        { x: 0, y: JUMP_IMPULSE_MAGNITUDE, z: 0 },
        true,
      );
      return true;
    }
    return false;
  };

  const applyMovement = (
    forward: boolean,
    backward: boolean,
    left: boolean,
    right: boolean,
    scaledDelta: number, // Expects 'scaledDelta' here, not raw 'delta'
  ) => {
    const impulse = { x: 0, y: 0, z: 0 };
    const torque = { x: 0, y: 0, z: 0 };

    // Scale movement and torque by scaledDelta. This ensures consistent feel
    // regardless of simulation speed.
    const movementForce = MOVEMENT_FORCE_MAGNITUDE * scaledDelta;
    const torqueForce = TORQUE_FORCE_MAGNITUDE * scaledDelta;

    if (forward) {
      impulse.z -= movementForce;
      torque.x -= torqueForce;
    }
    if (right) {
      impulse.x += movementForce;
      torque.z -= torqueForce;
    }
    if (backward) {
      impulse.z += movementForce;
      torque.x += torqueForce;
    }
    if (left) {
      impulse.x -= movementForce;
      torque.z += torqueForce;
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
      unsubscribeJump = subscribeKeys((state) => state.jump);
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
        // FIX: Ensure correct penalty is applied for wall hits
        addEvent(`Wall Collision: ${rewardConfig.penaltyWallHit}`);
        break;
      case "ground":
        break;
      default:
        break;
    }
  };

  useFrame((state, delta) => {
    // Crucially, calculate scaledDelta once at the beginning of useFrame.
    // All time-dependent calculations in this component should use this scaledDelta.
    const scaledDelta = delta * simulationSpeed;

    // Calculate current frame's immediate reward
    // Reward per tick should also be scaled by how much 'game time' has passed.
    let currentFrameReward = rewardConfig.rewardPerTick * scaledDelta;

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
      // Agent chooses action based on current observation
      switch (currentActionFromAgent) {
        case "forward":
          applyMovement(true, false, false, false, scaledDelta); // Pass scaledDelta
          break;
        case "backward":
          applyMovement(false, true, false, false, scaledDelta); // Pass scaledDelta
          break;
        case "jump":
          applyJump(); // Jump impulse does not depend on scaledDelta directly in its magnitude
          break;
        case "none":
          /* do nothing, let physics handle it */ break;
        default:
          break;
      }
      // Get observation and report *after* applying actions for this frame.
      // This ensures the observation reflects the result of actions.
      const currentObservation = getObservation();
      if (onObserve) {
        onObserve(currentObservation, currentFrameReward, false); // `false` for non-terminal steps
      }
    } else if (!agent) {
      // Keyboard control
      const { forward, backward, left, right, jump } = getKeys(); // Get jump state here

      // Apply movement
      applyMovement(forward, backward, left, right, scaledDelta); // Pass scaledDelta

      // Apply jump
      if (jump) {
        applyJump(); // Jump impulse does not depend on scaledDelta directly in its magnitude
      }
    }

    /**
     * Camera
     * Camera smoothing should also be scaled by scaledDelta for consistency.
     */
    const bodyPosition = body.current.translation();
    const cameraPosition = new THREE.Vector3();
    cameraPosition.copy(bodyPosition);
    cameraPosition.z += 2.25;
    cameraPosition.y += 0.65;

    const cameraTarget = new THREE.Vector3();
    cameraTarget.copy(bodyPosition);
    cameraTarget.y += 0.25;

    smoothedCameraPostion.lerp(cameraPosition, 5 * scaledDelta); // Use scaledDelta
    smoothedCameraTarget.lerp(cameraTarget, 5 * scaledDelta); // Use scaledDelta

    state.camera.position.copy(smoothedCameraPostion);
    state.camera.lookAt(smoothedCameraTarget);

    /**
     * Phases - Game End Conditions
     * Observation calls here also need to be aware of the reward earned on a terminal step.
     */
    const isPlayerAtEnd = bodyPosition.z < -(blocksCount * 4 + 2);
    const isPlayerFallen = bodyPosition.y < -4;

    if (isPlayerAtEnd && phase !== "ended") {
      end();
      if (onObserve) {
        onObserve(getObservation(), rewardConfig.rewardGoal, true); // Terminal reward
      }
    } else if (isPlayerFallen && phase !== "ended") {
      restart();
      if (onObserve) {
        onObserve(getObservation(), rewardConfig.penaltyFall, true); // Terminal penalty
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
      distance_to_end: distanceToEnd,
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
