import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { RAPIER_COLLISION_GROUPS } from "../../utils/constants";

type SpinnerProps = {
  position?: [number, number, number];
  isRandom?: boolean;
  geometry?: THREE.BufferGeometry;
  floorMaterial?: THREE.Material;
  obstacleMaterial?: THREE.Material;
};

export default function Spinner({
  position = [0, 0, 0],
  isRandom = true,
  geometry = new THREE.BoxGeometry(1, 1, 1),
  floorMaterial = new THREE.MeshStandardMaterial({ color: "greenyellow" }),
  obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" }),
}: SpinnerProps) {
  const obstacle = useRef<RapierRigidBody>(null!);
  const [speed] = useState(() =>
    isRandom ? (Math.random() + 0.2) * (Math.random() < 0.5 ? -1 : 1) : 0.5,
  );
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const rotation = new THREE.Quaternion();
    rotation.setFromEuler(new THREE.Euler(0, time * speed, 0));
    obstacle.current.setNextKinematicRotation(rotation);
  });
  return (
    <group position={position}>
      <mesh
        geometry={geometry}
        material={floorMaterial}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />

      <RigidBody
        ref={obstacle}
        type="kinematicPosition"
        colliders="cuboid"
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        collisionGroups={
          (RAPIER_COLLISION_GROUPS.OBSTACLE << 16) |
          RAPIER_COLLISION_GROUPS.PLAYER
        }
        userData={{ type: "obstacle", name: "spinner" }}
      >
        <mesh
          geometry={geometry}
          material={obstacleMaterial}
          scale={[3.5, 0.3, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}
