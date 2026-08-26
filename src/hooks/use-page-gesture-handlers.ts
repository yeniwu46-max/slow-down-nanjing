"use client";

import { useEffect } from "react";
import type { GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

export function useBadgeGestureCarousel(
  scrollPrev: () => void,
  scrollNext: () => void,
  onCollect?: () => void,
) {
  const enabled = useGestureStore((s) => s.enabled);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;
      if (id === "switch_scenery") scrollNext();
      if (id === "open_story") scrollPrev();
      if (id === "collect_badge" || id === "collect_today") onCollect?.();
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled, scrollPrev, scrollNext, onCollect]);
}

export function useDiaryGestureNav(
  onPrevMonth: () => void,
  onNextMonth: () => void,
  onGenerateSummary?: () => void,
) {
  const enabled = useGestureStore((s) => s.enabled);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;
      if (id === "switch_scenery") onNextMonth();
      if (id === "open_story") {
        onPrevMonth();
        onGenerateSummary?.();
      }
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled, onPrevMonth, onNextMonth, onGenerateSummary]);
}
