"use client";

import { Float, MeshTransmissionMaterial } from "@react-three/drei";

const BADGE_DATA = [
  { name: "wutong", color: "#7fa79b", x: -2.4 },
  { name: "heritage", color: "#c6a36b", x: -1.2 },
  { name: "moon", color: "#445854", x: 0 },
  { name: "nature", color: "#9b8fa8", x: 1.2 },
  { name: "city", color: "#d4a574", x: 2.4 },
];

interface BadgeShowcaseProps {
  activeIndex?: number;
  collected?: boolean;
}

export function BadgeShowcase({
  activeIndex = 2,
  collected = false,
}: BadgeShowcaseProps) {
  return (
    <group>
      <mesh position={[0, -0.8, 0]}>
        <boxGeometry args={[6, 0.15, 1.2]} />
        <meshStandardMaterial color="#2e3331" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[5.5, 1.2, 0.05]} />
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.2}
          chromaticAberration={0.02}
          anisotropy={0.1}
          distortion={0.05}
          distortionScale={0.2}
          temporalDistortion={0.05}
          transmission={0.95}
          color="#faf8f4"
        />
      </mesh>

      {BADGE_DATA.map((badge, i) => {
        const isActive = i === activeIndex;
        const y = isActive && collected ? 1.2 : 0.2;
        return (
          <Float
            key={badge.name}
            speed={1.5}
            rotationIntensity={0.1}
            floatIntensity={isActive ? 0.4 : 0.15}
          >
            <mesh position={[badge.x, y, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.08, 32]} />
              <meshStandardMaterial
                color={badge.color}
                metalness={0.7}
                roughness={0.3}
                emissive={isActive ? badge.color : "#000000"}
                emissiveIntensity={isActive ? 0.3 : 0}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

export { BADGE_DATA };
