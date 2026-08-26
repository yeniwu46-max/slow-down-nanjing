import { useRef } from "react";
import { MeshDistortMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

export function WaterPlane({ active }: { active: boolean }) {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.02;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]}>
      <circleGeometry args={[0.9, 48]} />
      <MeshDistortMaterial
        color="#7fa79b"
        transparent
        opacity={0.55}
        distort={active ? 0.35 : 0.1}
        speed={active ? 2.2 : 0.5}
        roughness={0.2}
      />
    </mesh>
  );
}
