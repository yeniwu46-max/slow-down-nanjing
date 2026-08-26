"use client";

import { useCallback } from "react";
import Link from "next/link";
import { GestureCalibration } from "@/components/gesture/gesture-calibration";
import { GestureHintBar } from "@/components/gesture/gesture-hint-bar";
import { GesturePreview } from "@/components/gesture/gesture-preview";
import { useGestureKeyboardFallback } from "@/components/gesture/gesture-mode-toggle";
import { useExperienceGesture } from "@/hooks/use-experience-gesture";
import { GESTURE_CONFIG } from "@/lib/gesture/config";
import { SCENE_GESTURES, type GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

export function ExperienceGuide() {
  const guideCompleted = useGestureStore((s) => s.guideCompleted);

  const { bindVideoElement, handleConfirmed } = useExperienceGesture({
    scene: "guide",
  });

  const onKeyboard = useCallback(
    (id: GestureId) => handleConfirmed(id),
    [handleConfirmed],
  );
  useGestureKeyboardFallback(true, onKeyboard);

  return (
    <div className="relative min-h-screen px-6 py-24">
      <GestureHintBar gestures={SCENE_GESTURES.guide} />

      <div className="mx-auto max-w-4xl">
        <GlassPanel strong className="p-8 md:p-10">
          <h1 className="font-serif text-2xl font-semibold text-ink md:text-3xl">
            {"\u624b\u52bf\u8bc6\u522b\u5f15\u5bfc"}
          </h1>
          <p className="mt-2 text-sm text-rock">
            {`\u6f14\u793a ${GESTURE_CONFIG.guideRequiredCount} \u4e2a\u624b\u52bf\u5373\u53ef\u8fdb\u5165\u4e0b\u4e00\u573a\u666f\uff08\u5f20\u5f00\u624b\u638c\u6700\u5feb\uff09`}
          </p>

          <div className="mt-8">
            <GestureCalibration completed={guideCompleted} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/experience/wind" variant="secondary">
              {"\u8df3\u8fc7\u5f15\u5bfc"}
            </Button>
            <Link
              href="/experience"
              className="text-sm text-rock underline-offset-4 hover:underline"
            >
              {"\u8fd4\u56de\u9996\u9875"}
            </Link>
          </div>
        </GlassPanel>
      </div>

      <GesturePreview
        onVideoMount={bindVideoElement}
        className="fixed top-24 right-6 z-[60]"
        size="md"
      />
    </div>
  );
}
