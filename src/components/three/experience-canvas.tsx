"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";

interface ExperienceCanvasProps {
  children: React.ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
}

export function ExperienceCanvas({
  children,
  className = "fixed inset-0 -z-10",
  camera = { position: [0, 2, 8], fov: 45 },
}: ExperienceCanvasProps) {
  return (
    <div className={className}>
      <Canvas
        camera={camera}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
