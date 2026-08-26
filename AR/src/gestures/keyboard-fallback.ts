import { useEffect } from "react";
import type { ArGestureId } from "./types";

const KEY_MAP: Record<string, ArGestureId> = {
  "1": "open_palm",
  "2": "prayer",
  "3": "wave",
  "4": "heart",
};

export function useGestureKeyboardFallback(
  active: boolean,
  onGesture: (id: ArGestureId) => void,
) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      const id = KEY_MAP[e.key];
      if (id) onGesture(id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onGesture]);
}
