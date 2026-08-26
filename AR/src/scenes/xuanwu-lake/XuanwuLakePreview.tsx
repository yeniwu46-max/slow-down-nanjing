import { Canvas } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import { LakeParticles } from "./LakeParticles";
import { WaterPlane } from "./WaterPlane";
import { Mascot } from "./Mascot";

/** 独立 R3F 预览（非 MindAR anchor），用于开发调试 */
export function XuanwuLakePreview({ active = true }: { active?: boolean }) {
  return (
    <Canvas camera={{ position: [0, 0.5, 2.5], fov: 50 }} dpr={[1, 1.5]}>
      <color attach="background" args={["#faf8f4"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 4, 2]} intensity={0.9} />
      <Stars radius={4} depth={20} count={800} factor={2} fade speed={0.5} />
      <Float speed={1.4}>
        <WaterPlane active={active} />
        <Mascot visible={active} />
        <LakeParticles active={active} />
      </Float>
    </Canvas>
  );
}
