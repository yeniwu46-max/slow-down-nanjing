"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

const POI_POINTS: [number, number, number][] = [
  [-2, 0.2, 0],
  [-0.5, 0.2, -1],
  [1, 0.2, -0.5],
  [2.5, 0.2, 0.5],
  [3.5, 0.2, -1],
];

interface RouteGlowProps {
  litSegments: number;
  color?: string;
}

export function RouteGlow({
  litSegments,
  color = "#7fa79b",
}: RouteGlowProps) {
  const points = useMemo(() => {
    const vectors = POI_POINTS.map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(vectors);
    const full = curve.getPoints(64);
    const segmentSize = Math.ceil(full.length / POI_POINTS.length);
    const visible = Math.min(full.length, litSegments * segmentSize + 1);
    return full.slice(0, visible).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [litSegments]);

  return (
    <>
      {points.length > 1 && (
        <Line points={points} color={color} lineWidth={2} transparent opacity={0.9} />
      )}
      {POI_POINTS.slice(0, litSegments).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y + 0.3, z]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </>
  );
}

export { POI_POINTS };
