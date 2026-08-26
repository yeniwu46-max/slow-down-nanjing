"use client";

import { GESTURE_HINTS, type GestureId } from "@/lib/gesture/types";
import { cn } from "@/lib/utils";

interface GestureHintBarProps {
  gestures: GestureId[];
  className?: string;
}

export function GestureHintBar({ gestures, className }: GestureHintBarProps) {
  if (gestures.length === 0) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-20 z-[55] flex justify-center px-4",
        className,
      )}
    >
      <div className="glass flex flex-wrap items-center justify-center gap-3 rounded-full px-4 py-2 shadow-s">
        {gestures.map((id) => (
          <span key={id} className="text-xs text-ink">
            <span className="font-medium text-primary">{GESTURE_HINTS[id].label}</span>
            <span className="mx-1 text-cloud">&middot;</span>
            <span className="text-rock">{GESTURE_HINTS[id].description}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
