"use client";

import { Coffee, Ear, Leaf, PersonStanding, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MOOD_OPTIONS, type MoodOption } from "@/lib/flow/mock";
import {
  formatDistance,
  recommendNearestQuietSpot,
} from "@/lib/map/nearby";
import type { MapPoi } from "@/lib/map/types";
import { cn } from "@/lib/utils";

const iconMap = {
  leaf: Leaf,
  cup: Coffee,
  walk: PersonStanding,
  ear: Ear,
};

export function MoodSection() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quietLoading, setQuietLoading] = useState(false);
  const [quietRec, setQuietRec] = useState<{
    poi: MapPoi;
    distanceKm: number;
  } | null>(null);

  async function handleMoodClick(mood: MoodOption) {
    setActiveId(mood.id);
    const { action } = mood;

    if (action.type === "link") {
      router.push(action.href);
      return;
    }

    if (action.type === "agent") {
      const params = new URLSearchParams({ q: action.prompt });
      if (action.autoSend) params.set("auto", "1");
      router.push(`${action.href}?${params.toString()}`);
      return;
    }

    if (action.type === "nearby") {
      setQuietLoading(true);
      setQuietRec(null);
      try {
        const rec = await recommendNearestQuietSpot();
        setQuietRec(rec);
      } finally {
        setQuietLoading(false);
      }
    }
  }

  return (
    <section className="relative space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {MOOD_OPTIONS.map((mood) => {
          const Icon = iconMap[mood.icon];
          const isActive = activeId === mood.id;

          return (
            <button
              key={mood.id}
              type="button"
              disabled={quietLoading && mood.id === "quiet"}
              onClick={() => void handleMoodClick(mood)}
              className={cn(
                "glass flex flex-col items-center gap-3 rounded-2xl px-4 py-8 shadow-s transition-all hover:-translate-y-0.5 disabled:opacity-60",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-paper",
              )}
            >
              <Icon className="h-8 w-8 text-ink" strokeWidth={1.5} />
              <span className="font-serif text-base text-ink">{mood.label}</span>
            </button>
          );
        })}
      </div>

      {quietLoading && (
        <p className="text-center text-sm text-rock">正在寻找离你最近的静处…</p>
      )}

      {quietRec && (
        <div className="glass-strong relative rounded-2xl p-5 shadow-m animate-fade-up">
          <button
            type="button"
            onClick={() => {
              setQuietRec(null);
              setActiveId(null);
            }}
            className="absolute right-3 top-3 rounded-full p-1 text-rock hover:text-ink"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-xs text-rock">想静一静 · 为你推荐</p>
          <p className="mt-1 font-serif text-lg text-ink">{quietRec.poi.name}</p>
          <p className="mt-1 text-sm text-rock">
            {quietRec.poi.description}
          </p>
          <p className="mt-2 text-xs text-rock">
            约 {formatDistance(quietRec.distanceKm)} · {quietRec.poi.category}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/map?poi=${quietRec.poi.id}`)}
            className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
          >
            在地图查看 →
          </button>
        </div>
      )}
    </section>
  );
}
