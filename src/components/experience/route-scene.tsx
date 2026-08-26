"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GestureHintBar } from "@/components/gesture/gesture-hint-bar";
import { GesturePreview } from "@/components/gesture/gesture-preview";
import { useGestureKeyboardFallback } from "@/components/gesture/gesture-mode-toggle";
import { ExperienceCanvas } from "@/components/three/experience-canvas";
import { RouteGlow, POI_POINTS } from "@/components/three/route-glow";
import { CityScene } from "@/components/three/city-scene";
import { CameraRig } from "@/components/three/camera-rig";
import { useExperienceGesture } from "@/hooks/use-experience-gesture";
import { SCENE_GESTURES, type GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";
import { GlassPanel } from "@/components/ui/glass-panel";

const POI_NAMES = [
  "\u9e21\u9e23\u5bfa",
  "\u603b\u7edf\u5e9c",
  "\u592b\u5b50\u5e99",
  "\u8001\u95e8\u4e1c",
  "\u96e8\u82b1\u53f0",
];
const MAX_SEGMENTS = POI_POINTS.length;

export function RouteScene() {
  const router = useRouter();
  const routeLitSegments = useGestureStore((s) => s.routeLitSegments);
  const incrementRouteSegment = useGestureStore((s) => s.incrementRouteSegment);
  const nextScenery = useGestureStore((s) => s.nextScenery);
  const sceneryIndex = useGestureStore((s) => s.sceneryIndex);
  const [story, setStory] = useState<string | null>(null);

  const sceneryColors = ["#c8d6d4", "#7fa79b", "#9b8fa8", "#d4a574"];

  useEffect(() => {
    useGestureStore.getState().resetRouteSegments();
  }, []);

  useEffect(() => {
    if (routeLitSegments >= MAX_SEGMENTS) {
      const t = setTimeout(() => router.push("/experience/badge"), 1500);
      return () => clearTimeout(t);
    }
  }, [routeLitSegments, router]);

  const fetchStory = useCallback(async (poiName: string) => {
    try {
      const res = await fetch("/api/copy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routeId: "wutong-walk",
          keywords: [poiName, "\u6162\u884c", "\u5357\u4eac"],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setStory(data.poem || data.postcardText || `${poiName}\u2026`);
      }
    } catch {
      setStory(`\u5728${poiName}\uff0c\u65f6\u95f4\u4eff\u4f5b\u6162\u4e86\u4e0b\u6765\u3002`);
    }
  }, []);

  const { bindVideoElement, handleConfirmed } = useExperienceGesture({
    scene: "route",
    onGesture: (id) => {
      if (id === "light_route") {
        const seg = useGestureStore.getState().routeLitSegments;
        incrementRouteSegment();
        const next = seg + 1;
        if (next <= POI_NAMES.length) fetchStory(POI_NAMES[next - 1]);
      }
      if (id === "switch_scenery") nextScenery();
      if (id === "open_story") {
        const seg = useGestureStore.getState().routeLitSegments;
        if (seg > 0) fetchStory(POI_NAMES[seg - 1] ?? "\u5357\u4eac");
      }
    },
  });

  const onKeyboard = useCallback(
    (id: GestureId) => handleConfirmed(id),
    [handleConfirmed],
  );
  useGestureKeyboardFallback(true, onKeyboard);

  return (
    <div className="relative min-h-screen">
      <ExperienceCanvas camera={{ position: [0, 4, 12], fov: 45 }}>
        <CityScene fogColor={sceneryColors[sceneryIndex]} buildingColor="#445854" />
        <RouteGlow litSegments={routeLitSegments} />
        <CameraRig target={[0, 0, 0]} />
      </ExperienceCanvas>

      <GestureHintBar gestures={SCENE_GESTURES.route} />

      <div className="relative z-10 flex min-h-screen gap-6 p-6 pt-24 lg:p-10">
        <GlassPanel strong className="hidden w-[380px] shrink-0 flex-col p-6 lg:flex">
          <p className="text-xs text-rock">{"AI \u63a8\u8350\u8def\u7ebf"}</p>
          <h2 className="mt-2 font-serif text-2xl text-ink">{"\u68a7\u6850\u6162\u884c"}</h2>
          <p className="mt-1 text-sm text-rock">{"\u7ea6 90min \u00b7 6.2 km"}</p>
          <div className="mt-6 space-y-2">
            {POI_NAMES.map((name, i) => (
              <div
                key={name}
                className={`flex items-center gap-2 text-sm ${
                  i < routeLitSegments ? "text-primary" : "text-cloud"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {name}
              </div>
            ))}
          </div>
          {story && (
            <p className="mt-6 border-t border-cloud/50 pt-4 text-sm leading-relaxed text-rock">
              {story}
            </p>
          )}
        </GlassPanel>

        <div className="flex flex-1 flex-col items-center justify-center text-center lg:items-start lg:text-left">
          <p className="text-sm text-rock">
            {"\u5f20\u5f00\u624b\u638c\u6216\u5411\u4e0a\u63a7\uff0c\u9010\u6bb5\u70b9\u4eae"}
          </p>
          <p className="mt-2 font-serif text-3xl text-ink">
            {routeLitSegments} / {MAX_SEGMENTS}
          </p>
        </div>
      </div>

      <GesturePreview onVideoMount={bindVideoElement} size="md" />
    </div>
  );
}
