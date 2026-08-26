"use client";

import { ExperienceCanvas } from "@/components/three/experience-canvas";
import { RouteGlow } from "@/components/three/route-glow";

interface MapRouteGlowOverlayProps {
  segments: number;
}

export function MapRouteGlowOverlay({ segments }: MapRouteGlowOverlayProps) {
  if (segments <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <ExperienceCanvas className="absolute inset-0 h-full w-full">
        <RouteGlow litSegments={segments} />
      </ExperienceCanvas>
    </div>
  );
}
