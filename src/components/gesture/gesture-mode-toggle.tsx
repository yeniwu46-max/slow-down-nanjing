"use client";

import { useEffect, useRef } from "react";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGestureStore } from "@/stores/use-gesture-store";

export function GestureModeToggle({ className }: { className?: string }) {
  const enabled = useGestureStore((s) => s.enabled);
  const setEnabled = useGestureStore((s) => s.setEnabled);

  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition-colors",
        enabled
          ? "bg-primary text-white"
          : "bg-cloud/40 text-rock hover:bg-cloud/60",
        className,
      )}
      aria-pressed={enabled}
      aria-label={"\u5207\u6362\u624b\u52bf\u6a21\u5f0f"}
    >
      <Hand className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">{"\u624b\u52bf"}</span>
    </button>
  );
}

export function useGestureKeyboardFallback(
  active: boolean,
  onGesture: (id: import("@/lib/gesture/types").GestureId) => void,
) {
  useEffect(() => {
    if (!active) return;

    const map: Record<string, import("@/lib/gesture/types").GestureId> = {
      "1": "release_wind",
      "2": "light_route",
      "3": "collect_badge",
      "4": "open_story",
      "5": "switch_scenery",
      "6": "start_journey",
      "7": "embrace_city",
    };

    const handler = (e: KeyboardEvent) => {
      const id = map[e.key];
      if (id) {
        e.preventDefault();
        onGesture(id);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onGesture]);
}
