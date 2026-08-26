"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { GestureHintBar } from "@/components/gesture/gesture-hint-bar";
import { GesturePreview } from "@/components/gesture/gesture-preview";
import { useGestureKeyboardFallback } from "@/components/gesture/gesture-mode-toggle";
import { ExperienceCanvas } from "@/components/three/experience-canvas";
import { WindParticles } from "@/components/three/wind-particles";
import { CityScene } from "@/components/three/city-scene";
import { CameraRig } from "@/components/three/camera-rig";
import { useExperienceGesture } from "@/hooks/use-experience-gesture";
import { SCENE_GESTURES, type GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

export function WindScene() {
  const router = useRouter();
  const lineRef = useRef<SVGPathElement>(null);
  const windReleased = useGestureStore((s) => s.windReleased);
  const setWindReleased = useGestureStore((s) => s.setWindReleased);
  const reducedMotion = useGestureStore((s) => s.reducedMotion);

  const { bindVideoElement, handleConfirmed } = useExperienceGesture({
    scene: "wind",
    onGesture: (id) => {
      if (id === "release_wind") setWindReleased(true);
    },
  });

  useEffect(() => {
    if (!windReleased) return;

    if (reducedMotion) {
      const t = setTimeout(() => router.push("/experience/route"), 1200);
      return () => clearTimeout(t);
    }

    if (!lineRef.current) return;

    const path = lineRef.current;
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => router.push("/experience/route"), 1000);
      },
    });
    tl.to(path, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" });

    return () => {
      tl.kill();
    };
  }, [windReleased, reducedMotion, router]);

  const onKeyboard = useCallback(
    (id: GestureId) => handleConfirmed(id),
    [handleConfirmed],
  );
  useGestureKeyboardFallback(true, onKeyboard);

  return (
    <div className="relative min-h-screen">
      <ExperienceCanvas camera={{ position: [0, 3, 10], fov: 50 }}>
        <CityScene fogColor="#e6eef0" />
        <WindParticles active={windReleased} />
        <CameraRig enabled={windReleased} target={[0, 0, -2]} />
      </ExperienceCanvas>

      <GestureHintBar gestures={SCENE_GESTURES.wind} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-6 pb-24">
        <p className="mb-6 text-center font-serif text-xl text-ink md:text-2xl">
          {"\u8ba9\u98ce\u5e26\u4f60\u770b\u89c1\u57ce\u5e02\u7684\u547c\u5438"}
        </p>
        {!windReleased && (
          <p className="text-sm text-rock">
            {"\u5f20\u5f00\u624b\u638c\uff0c\u91ca\u653e\u98ce\u7ebf"}
          </p>
        )}

        <svg
          className="pointer-events-none absolute inset-x-0 bottom-32 mx-auto h-32 w-full max-w-2xl"
          viewBox="0 0 400 100"
          fill="none"
        >
          <path
            ref={lineRef}
            d="M 20 80 Q 100 20 200 50 T 380 30"
            stroke="var(--color-route-wutong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <GesturePreview onVideoMount={bindVideoElement} size="md" />
    </div>
  );
}
