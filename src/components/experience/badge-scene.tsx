"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { GestureHintBar } from "@/components/gesture/gesture-hint-bar";
import { GesturePreview } from "@/components/gesture/gesture-preview";
import { useGestureKeyboardFallback } from "@/components/gesture/gesture-mode-toggle";
import { ExperienceCanvas } from "@/components/three/experience-canvas";
import { BadgeShowcase } from "@/components/three/badge-showcase";
import { useExperienceGesture } from "@/hooks/use-experience-gesture";
import { SCENE_GESTURES, type GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";
import { Button } from "@/components/ui/button";

export function BadgeScene() {
  const badgeCollected = useGestureStore((s) => s.badgeCollected);
  const setBadgeCollected = useGestureStore((s) => s.setBadgeCollected);
  const reducedMotion = useGestureStore((s) => s.reducedMotion);
  const ctaRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  const { bindVideoElement, navigateNext, handleConfirmed } = useExperienceGesture({
    scene: "badge",
    onGesture: (id) => {
      if (id === "collect_badge") setBadgeCollected(true);
    },
  });

  useEffect(() => {
    if (!badgeCollected) return;

    if (reducedMotion) {
      if (ctaRef.current) gsap.set(ctaRef.current, { opacity: 1 });
      return;
    }

    if (flyRef.current) {
      gsap.fromTo(
        flyRef.current,
        { x: 0, y: 0, scale: 1, opacity: 1 },
        {
          x: window.innerWidth * 0.35,
          y: -window.innerHeight * 0.35,
          scale: 0.3,
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut",
        },
      );
    }

    if (ctaRef.current) {
      gsap.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 1.2 },
      );
    }
  }, [badgeCollected, reducedMotion]);

  const onKeyboard = useCallback(
    (id: GestureId) => handleConfirmed(id),
    [handleConfirmed],
  );
  useGestureKeyboardFallback(true, onKeyboard);

  return (
    <div className="relative min-h-screen bg-paper">
      <ExperienceCanvas camera={{ position: [0, 1.5, 6], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1} />
        <BadgeShowcase activeIndex={2} collected={badgeCollected} />
      </ExperienceCanvas>

      <GestureHintBar gestures={SCENE_GESTURES.badge} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end px-6 pb-16 pt-32">
        <h1 className="font-serif text-2xl text-ink md:text-3xl">
          {"\u5fbd\u7ae0\u535a\u7269\u9986"}
        </h1>
        <p className="mt-2 text-sm text-rock">
          {"\u53cc\u624b\u5408\u62e6\u6216\u5f20\u5f00\u624b\u638c\uff0c\u6536\u96c6\u5fbd\u7ae0"}
        </p>

        {badgeCollected && (
          <div
            ref={flyRef}
            className="pointer-events-none fixed left-1/2 top-1/2 z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-l"
            aria-hidden
          />
        )}

        <div ref={ctaRef} className="mt-8 opacity-0">
          {badgeCollected && (
            <Button size="lg" onClick={() => navigateNext("/map")}>
              {"\u8fdb\u5165\u6211\u7684\u6162\u884c\u5730\u56fe \u2192"}
            </Button>
          )}
        </div>
      </div>

      <GesturePreview onVideoMount={bindVideoElement} size="md" />
    </div>
  );
}
