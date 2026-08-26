"use client";

import dynamic from "next/dynamic";
import { forwardRef, type ComponentProps } from "react";
import type { MapLibreHandle } from "./map-libre-canvas";

const MapLibreCanvasInner = dynamic(
  () => import("./map-libre-canvas").then((m) => m.MapLibreCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-paper">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/30" />
      </div>
    ),
  },
);

export type { MapLibreHandle } from "./map-libre-canvas";
export type MapLibreProps = ComponentProps<typeof MapLibreCanvasInner>;

export const MapLibre = forwardRef<MapLibreHandle, MapLibreProps>(
  function MapLibre(props, ref) {
    return <MapLibreCanvasInner ref={ref} {...props} />;
  },
);
