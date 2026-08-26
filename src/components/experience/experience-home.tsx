"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ExperienceCanvas } from "@/components/three/experience-canvas";
import { CityScene } from "@/components/three/city-scene";
import { CameraRig } from "@/components/three/camera-rig";
import { GestureHintBar } from "@/components/gesture/gesture-hint-bar";
import { GesturePreview } from "@/components/gesture/gesture-preview";
import { useGestureKeyboardFallback } from "@/components/gesture/gesture-mode-toggle";
import { useExperienceGesture } from "@/hooks/use-experience-gesture";
import { SCENE_GESTURES, type GestureId } from "@/lib/gesture/types";

export function ExperienceHome() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  const { bindVideoElement, navigateNext, handleConfirmed } = useExperienceGesture({
    scene: "home",
    onGesture: (id) => {
      if (id === "start_journey" || id === "embrace_city") {
        navigateNext("/experience/guide");
      }
    },
  });

  useEffect(() => {
    if (titleRef.current) {
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" },
      );
    }
  }, []);

  const onKeyboard = useCallback(
    (id: GestureId) => handleConfirmed(id),
    [handleConfirmed],
  );
  useGestureKeyboardFallback(true, onKeyboard);

  return (
    <div className="relative min-h-screen">
      <ExperienceCanvas>
        <CityScene showWater />
        <CameraRig />
      </ExperienceCanvas>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper/30 via-transparent to-paper/60"
        aria-hidden
      />

      <GestureHintBar gestures={SCENE_GESTURES.home} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm tracking-[0.2em] text-rock uppercase">
          Slow down, Feel Nanjing
        </p>
        <h1
          ref={titleRef}
          className="max-w-2xl font-serif text-3xl font-semibold leading-snug text-ink md:text-5xl"
        >
          {"\u4eca\u5929\uff0c\u4e0d\u5fc5\u7740\u7740\u62b5\u8fbe"}
        </h1>
        <p className="mt-6 max-w-md text-base text-rock">
          {"\u5f20\u5f00\u624b\u638c\uff0c\u5f00\u542f\u65c5\u7a0b"}
        </p>
        <div className="mt-12 flex gap-4">
          {["\u542f\u7a0b", "\u62e5\u62b1", "\u6162\u884c"].map((label) => (
            <span key={label} className="glass rounded-full px-4 py-2 text-xs text-ink">
              {label}
            </span>
          ))}
        </div>
      </div>

      <GesturePreview onVideoMount={bindVideoElement} size="md" />
    </div>
  );
}
