"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  GestureHintBar,
} from "@/components/gesture/gesture-hint-bar";
import {
  GesturePreview,
} from "@/components/gesture/gesture-preview";
import {
  useGestureKeyboardFallback,
} from "@/components/gesture/gesture-mode-toggle";
import { useGestureDetection } from "@/hooks/use-gesture-detection";
import { OVERLAY_GESTURES, type GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

interface GestureOverlayProps {
  onGesture?: (id: GestureId) => void;
}

export function GestureOverlay({ onGesture }: GestureOverlayProps) {
  const pathname = usePathname();
  const enabled = useGestureStore((s) => s.enabled);
  const emitGesture = useGestureStore((s) => s.emitGesture);
  const nextScenery = useGestureStore((s) => s.nextScenery);

  const allowedGestures = useMemo(() => {
    const key = Object.keys(OVERLAY_GESTURES).find((k) =>
      pathname.startsWith(k),
    );
    return key ? OVERLAY_GESTURES[key] : [];
  }, [pathname]);

  const handleGesture = useCallback(
    (id: GestureId) => {
      emitGesture({
        id,
        confidence: 1,
        timestamp: Date.now(),
      });
      if (id === "switch_scenery") nextScenery();
      onGesture?.(id);
      window.dispatchEvent(
        new CustomEvent("slowdown:gesture", { detail: { id } }),
      );
    },
    [emitGesture, nextScenery, onGesture],
  );

  const { canvasRef, bindVideoElement } = useGestureDetection({
    active: enabled && allowedGestures.length > 0,
    allowedGestures,
    onGesture: handleGesture,
  });

  useGestureKeyboardFallback(enabled, handleGesture);

  if (!enabled || allowedGestures.length === 0) return null;

  return (
    <>
      <GestureHintBar gestures={allowedGestures} />
      <GesturePreview onVideoMount={bindVideoElement} canvasRef={canvasRef} />
    </>
  );
}
