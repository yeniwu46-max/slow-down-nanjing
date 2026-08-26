import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Points, BufferAttribute } from "three";

export function EgretsBurst({ active }: { active: boolean }) {
  const ref = useRef<Points>(null);
  const count = 24;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = Math.random() * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const attr = ref.current.geometry.attributes.position as BufferAttribute;
    const pos = attr.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] += 0.02;
      pos[i * 3 + 1] = 0.2 + Math.sin(t * 3 + i) * 0.08 + i * 0.01;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#faf8f4" transparent opacity={0.9} />
    </points>
  );
}
