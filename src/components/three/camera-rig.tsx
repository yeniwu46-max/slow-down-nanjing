"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

interface CameraRigProps {
  target?: [number, number, number];
  speed?: number;
  enabled?: boolean;
}

export function CameraRig({
  target = [0, 0, 0],
  speed = 0.02,
  enabled = true,
}: CameraRigProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime * 0.15;
    state.camera.position.x = target[0] + Math.sin(t) * 0.5;
    state.camera.position.y = target[1] + 2 + Math.sin(t * 0.5) * 0.2;
    state.camera.lookAt(target[0], target[1], target[2]);
  });

  return <group ref={groupRef} />;
}
