"use client";

import { Float, Stars } from "@react-three/drei";

const BUILDINGS: [number, number, number, number][] = [
  [-3, 0.5, -2, 1.2],
  [-1.5, 0.8, -3, 1.8],
  [0, 1.2, -2.5, 2.5],
  [2, 0.6, -1.5, 1.4],
  [3.5, 1, -3, 2],
  [-2, 0.4, 1, 1],
  [1, 0.3, 2, 0.9],
];

interface CitySceneProps {
  fogColor?: string;
  buildingColor?: string;
  showWater?: boolean;
}

export function CityScene({
  fogColor = "#c8d6d4",
  buildingColor = "#445854",
  showWater = true,
}: CitySceneProps) {
  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 8, 25]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} color="#faf8f4" />
      <Stars radius={80} depth={40} count={800} factor={2} saturation={0} fade speed={0.5} />

      {showWater && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial
            color="#d5e0e1"
            transparent
            opacity={0.7}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
      )}

      {BUILDINGS.map(([x, h, z, w], i) => (
        <Float key={i} speed={0.5} rotationIntensity={0} floatIntensity={0.1}>
          <mesh position={[x, h / 2, z]}>
            <boxGeometry args={[w * 0.4, h, w * 0.4]} />
            <meshStandardMaterial
              color={buildingColor}
              transparent
              opacity={0.85}
            />
          </mesh>
        </Float>
      ))}

      <mesh position={[0, 3, -4]}>
        <coneGeometry args={[0.8, 2.5, 4]} />
        <meshStandardMaterial color="#2e3331" />
      </mesh>
    </>
  );
}
