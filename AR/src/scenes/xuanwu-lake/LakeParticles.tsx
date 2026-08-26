import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Points } from "three";
import * as THREE from "three";

interface LakeParticlesProps {
  active: boolean;
  count?: number;
  color?: string;
}

export function LakeParticles({
  active,
  count = 280,
  color = "#c6a36b",
}: LakeParticlesProps) {
  const ref = useRef<Points>(null);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 2.4;
      pos[i * 3 + 1] = Math.random() * 1.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      vel[i * 3] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = -0.01 - Math.random() * 0.015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.006;
    }
    return { positions: pos, velocities: vel };
  }, [count]);

  useFrame(() => {
    if (!ref.current || !active) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] += velocities[i * 3];
      arr[i * 3 + 1] += velocities[i * 3 + 1];
      arr[i * 3 + 2] += velocities[i * 3 + 2];
      if (arr[i * 3 + 1] < -0.8) {
        arr[i * 3 + 1] = 1.2;
        arr[i * 3] = (Math.random() - 0.5) * 2.4;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color={color}
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
