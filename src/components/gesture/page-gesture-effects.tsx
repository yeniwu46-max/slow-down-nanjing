"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import type { GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";
import { GlassPanel } from "@/components/ui/glass-panel";

const MapRouteGlow = dynamic(
  () =>
    import("@/components/map/map-route-glow-overlay").then(
      (m) => m.MapRouteGlowOverlay,
    ),
  { ssr: false },
);

interface MapGestureEnhancementProps {
  onFilterCycle?: () => void;
  onRouteLight?: () => void;
}

export function MapGestureEnhancement({
  onFilterCycle,
  onRouteLight,
}: MapGestureEnhancementProps) {
  const enabled = useGestureStore((s) => s.enabled);
  const [story, setStory] = useState<string | null>(null);
  const [routeLit, setRouteLit] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;

      if (id === "switch_scenery") {
        onFilterCycle?.();
      }
      if (id === "light_route") {
        setRouteLit((n) => Math.min(n + 1, 5));
        onRouteLight?.();
      }
      if (id === "open_story") {
        fetch("/api/copy/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routeId: "wutong-walk",
            keywords: ["\u5357\u4eac", "\u666f\u70b9"],
          }),
        })
          .then((r) => r.json())
          .then((data) =>
            setStory(
              data.poem ??
                "\u6162\u4e0b\u6765\uff0c\u624d\u80fd\u770b\u89c1\u57ce\u5e02\u7684\u6e29\u5ea6\u3002",
            ),
          )
          .catch(() =>
            setStory(
              "\u6162\u4e0b\u6765\uff0c\u624d\u80fd\u770b\u89c1\u57ce\u5e02\u7684\u6e29\u5ea6\u3002",
            ),
          );
      }
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled, onFilterCycle, onRouteLight]);

  useEffect(() => {
    if (story) {
      const t = setTimeout(() => setStory(null), 5000);
      return () => clearTimeout(t);
    }
  }, [story]);

  if (!enabled) return null;

  return (
    <>
      <MapRouteGlow segments={routeLit} />
      {story && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 z-20 w-[90vw] max-w-md -translate-x-1/2">
          <GlassPanel strong className="p-4 text-sm leading-relaxed text-rock">
            {story}
          </GlassPanel>
        </div>
      )}
    </>
  );
}

export function useRecordsGestureTasks(
  setCompleted: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
) {
  const enabled = useGestureStore((s) => s.enabled);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;
      if (id === "open_story") {
        setCompleted((prev) => ({ ...prev, mood: true }));
      }
      if (id === "collect_today" || id === "collect_badge") {
        setCompleted((prev) => ({ ...prev, walk: true, stretch: true }));
        gsap.fromTo(
          ".records-progress-ring",
          { scale: 1 },
          { scale: 1.05, duration: 0.4, yoyo: true, repeat: 1 },
        );
      }
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled, setCompleted]);
}
