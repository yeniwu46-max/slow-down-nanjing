import { Float, Sphere } from "@react-three/drei";

export function Mascot({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.6}>
      <group position={[0, 0.15, 0]}>
        <Sphere args={[0.22, 32, 32]}>
          <meshStandardMaterial color="#faf8f4" roughness={0.35} metalness={0.05} />
        </Sphere>
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.12, 0.18, 4]} />
          <meshStandardMaterial color="#7fa79b" />
        </mesh>
        <mesh position={[-0.08, 0.05, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#445854" />
        </mesh>
        <mesh position={[0.08, 0.05, 0.18]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial color="#445854" />
        </mesh>
      </group>
    </Float>
  );
}
