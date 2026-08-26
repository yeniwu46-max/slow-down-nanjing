"use client";

import { useEffect } from "react";
import { useGestureStore } from "@/stores/use-gesture-store";

export function useReducedMotionPreference() {
  const setReducedMotion = useGestureStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setReducedMotion]);
}
