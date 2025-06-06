import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { RAPIER_COLLISION_GROUPS } from "../../utils/constants";

type AxeProps = {
  position?: [number, number, number];
  isRandom?: boolean;
  geometry?: THREE.BufferGeometry;
  floorMaterial?: THREE.Material;
  obstacleMaterial?: THREE.Material;
};

export default function Axe({
  position = [0, 0, 0],
  isRandom = true,
  geometry = new THREE.BoxGeometry(1, 1, 1),
  floorMaterial = new THREE.MeshStandardMaterial({ color: "greenyellow" }),
  obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" }),
}: AxeProps) {
  const obstacle = useRef<RapierRigidBody>(null!);
  const [timeOffset] = useState(() =>
    isRandom ? Math.random() * Math.PI * 2 : Math.PI / 2,
  );
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const x = Math.sin(time + timeOffset) * 1.25;
    obstacle.current.setNextKinematicTranslation({
      x: position[0] + x,
      y: position[1] + 0.75,
      z: position[2],
    });
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
        position={[0, 0.3, 0]}
        restitution={0.2}
        friction={0}
        collisionGroups={
          (RAPIER_COLLISION_GROUPS.OBSTACLE << 16) |
          RAPIER_COLLISION_GROUPS.PLAYER
        }
        userData={{ type: "obstacle", name: "axe" }}
      >
        <mesh
          geometry={geometry}
          material={obstacleMaterial}
          scale={[1.5, 1.5, 0.3]}
          castShadow
          receiveShadow
        />
      </RigidBody>
    </group>
  );
}
