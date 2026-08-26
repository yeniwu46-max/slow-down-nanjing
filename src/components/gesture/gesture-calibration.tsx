"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Check } from "lucide-react";
import { GESTURE_HINTS, type GestureId } from "@/lib/gesture/types";
import { cn } from "@/lib/utils";

const GUIDE_ORDER: GestureId[] = [
  "release_wind",
  "light_route",
  "collect_badge",
  "open_story",
  "switch_scenery",
];

interface GestureCalibrationProps {
  completed: Set<GestureId>;
}

export function GestureCalibration({ completed }: GestureCalibrationProps) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    GUIDE_ORDER.forEach((id, i) => {
      if (completed.has(id) && cardRefs.current[i]) {
        gsap.fromTo(
          cardRefs.current[i],
          { scale: 1 },
          { scale: 1.03, duration: 0.3, yoyo: true, repeat: 1 },
        );
      }
    });
  }, [completed]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {GUIDE_ORDER.map((id, index) => {
        const done = completed.has(id);
        const hint = GESTURE_HINTS[id];
        return (
          <div
            key={id}
            ref={(el) => {
              cardRefs.current[index] = el;
            }}
            className={cn(
              "glass rounded-xl p-5 transition-shadow",
              done && "ring-2 ring-primary shadow-m",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-ink">{hint.label}</span>
              {done && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
              )}
            </div>
            <p className="text-sm text-rock">{hint.description}</p>
          </div>
        );
      })}
    </div>
  );
}
