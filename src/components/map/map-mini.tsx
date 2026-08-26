"use client";

import { MapLibre } from "./map-libre";

import type { MapRoute } from "@/lib/map/types";

interface MapMiniProps {
  className?: string;
  showRoute?: boolean;
  pitch?: number;
  zoom?: number;
  route?: MapRoute;
}

/** ?? flow ????????? */
export function MapMini({
  className,
  showRoute = true,
  pitch = 35,
  zoom = 11.2,
  route,
}: MapMiniProps) {
  return (
    <MapLibre
      className={className}
      showRoute={showRoute}
      showLabels={false}
      showHeatmap={false}
      interactive={false}
      pitch={pitch}
      zoom={zoom}
      route={route}
    />
  );
}
