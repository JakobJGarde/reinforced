import * as THREE from "three";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { RAPIER_COLLISION_GROUPS } from "../utils/constants";
import React from "react";

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const floor1Material = new THREE.MeshStandardMaterial({ color: "limegreen" });
const floor2Material = new THREE.MeshStandardMaterial({ color: "greenyellow" });
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: "orangered" });
const wallMaterial = new THREE.MeshStandardMaterial({ color: "slategrey" });

function BlockStart({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, -0.1, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
    </group>
  );
}

function BlockEnd({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const hamburger = useGLTF("./hamburger.glb");
  hamburger.scene.children.forEach((mesh) => {
    mesh.castShadow = true;
  });
  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position={[0, 0, 0]}
        scale={[4, 0.2, 4]}
        receiveShadow
      />
      <RigidBody
        type="fixed"
        colliders="hull"
        position={[0, 0.25, 0]}
        restitution={0.2}
        friction={0}
      >
        <primitive object={hamburger.scene} scale={0.2} />
      </RigidBody>
    </group>
  );
}

function Bounds({ length = 10 }: { length?: number }) {
  return (
    <>
      {/* GROUND */}
      <RigidBody
        type="fixed"
        restitution={0.2}
        friction={1}
        collisionGroups={
          (RAPIER_COLLISION_GROUPS.GROUND << 16) |
          RAPIER_COLLISION_GROUPS.PLAYER
        }
        userData={{ type: "ground" }}
      >
        <CuboidCollider
          args={[2, 0.1, 2 * length]}
          position={[0, -0.1, -(length * 2) + 2]}
        />
      </RigidBody>
      {/* WALLS */}
      <RigidBody
        type="fixed"
        restitution={0.2}
        friction={2}
        collisionGroups={
          (RAPIER_COLLISION_GROUPS.WALL << 16) | RAPIER_COLLISION_GROUPS.PLAYER
        }
        userData={{ type: "wall" }}
      >
        {/* Right Wall */}
        <mesh
          geometry={boxGeometry}
          material={wallMaterial}
          position={[2.15, 0.75, -(length * 2) + 2]}
          scale={[0.3, 1.5, 4 * length]}
          castShadow
        />
        {/* Left Wall */}
        <mesh
          geometry={boxGeometry}
          material={wallMaterial}
          position={[-2.15, 0.75, -(length * 2) + 2]}
          scale={[0.3, 1.5, 4 * length]}
          receiveShadow
        />
        {/* End Wall */}
        <mesh
          geometry={boxGeometry}
          material={wallMaterial}
          position={[0, 0.75, -(length * 4) + 2]}
          scale={[4, 1.5, 0.3]}
          receiveShadow
        />
      </RigidBody>
    </>
  );
}

// Update LevelProps and Level component
type LevelProps = {
  count?: number;
  obstacles: React.ComponentType<{
    position?: [number, number, number];
    isRandom?: boolean;
    geometry?: THREE.BufferGeometry;
    floorMaterial?: THREE.Material;
    obstacleMaterial?: THREE.Material;
  }>[];
  isRandom?: boolean;
};

function Level({
  count = 5,
  obstacles,
  isRandom = true, // Default to random
}: LevelProps) {
  const blocks = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < count; i++) {
      let obstacle;
      if (isRandom)
        obstacle = obstacles[Math.floor(Math.random() * obstacles.length)];
      else obstacle = obstacles[i % obstacles.length]; // Cycle through obstacles if not random
      blocks.push(obstacle);
    }
    return blocks;
  }, [count, obstacles, isRandom]);

  return (
    <>
      <BlockStart position={[0, 0, 0]} />
      {blocks.map((BlockComponent, index) => (
        <BlockComponent
          key={index}
          position={[0, 0, -(index + 1) * 4]}
          isRandom={isRandom}
          geometry={boxGeometry}
          floorMaterial={floor2Material}
          obstacleMaterial={obstacleMaterial}
        /> // Pass isRandom
      ))}
      <BlockEnd position={[0, 0, -(count + 1) * 4]} />
      <Bounds length={count + 2} />
    </>
  );
}

export default React.memo(Level);
