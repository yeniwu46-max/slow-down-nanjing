"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { Download, ImageIcon, Share2 } from "lucide-react";
import { useGestureStore } from "@/stores/use-gesture-store";
import type { GestureId } from "@/lib/gesture/types";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

const TEMPLATES = [
  {
    id: 1,
    label: "今天，我选择慢一点",
    image: "/images/hero-bg.png",
    note: "玄武湖 · 湖风信笺",
  },
  {
    id: 2,
    label: "在梧桐树下，遇见另一种南京",
    image: "/images/hero-scene.jpg",
    note: "梧桐慢行 · 90 min",
  },
  {
    id: 3,
    label: "慢下来，才会遇见城市的温度",
    image: "/images/mist-bg.jpg",
    note: "金陵风物 · 水墨江南",
  },
];

export function ShareView() {
  const enabled = useGestureStore((s) => s.enabled);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: Event) => {
      const id = (e as CustomEvent<{ id: GestureId }>).detail.id;
      if (id === "switch_scenery" || id === "open_story") {
        setTemplateIndex((i) => (i + 1) % TEMPLATES.length);
      }
      if (id === "collect_today" || id === "collect_badge") {
        setSaved(true);
        if (posterRef.current) {
          gsap.fromTo(
            posterRef.current,
            { scale: 1 },
            { scale: 0.98, duration: 0.3, yoyo: true, repeat: 1 },
          );
        }
      }
    };

    window.addEventListener("slowdown:gesture", handler);
    return () => window.removeEventListener("slowdown:gesture", handler);
  }, [enabled]);

  const template = TEMPLATES[templateIndex];

  return (
    <div className="mx-auto max-w-6xl px-5 py-24 md:px-10">
      <h1 className="font-serif text-2xl font-semibold text-ink md:text-3xl">
        {"\u5206\u4eab\u6211\u7684\u6162\u884c"}
      </h1>
      <p className="mt-2 text-sm text-rock">
        {"\u6325\u624b\u5207\u6362\u6a21\u677f\uff0c\u53cc\u624b\u5408\u62e2\u4fdd\u5b58\u6d77\u62a5"}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div ref={posterRef} className="relative overflow-hidden rounded-3xl shadow-l">
          <div className="relative aspect-[4/5] min-h-[420px]">
            <Image
              src={template.image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 via-transparent to-paper/30" />
            <div className="absolute bottom-0 left-0 p-8 text-white">
              <p className="font-serif text-2xl md:text-3xl">{template.label}</p>
              <p className="mt-2 text-sm opacity-90">{template.note}</p>
            </div>
          </div>
          {saved && (
            <p className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs text-white">
              {"\u5df2\u6536\u85cf"}
            </p>
          )}
        </div>

        <GlassPanel strong className="p-5">
          <p className="text-sm font-medium text-ink">{"\u6a21\u677f\u9009\u62e9"}</p>
          <div className="mt-4 space-y-3">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateIndex(i)}
                className={`w-full rounded-xl p-3 text-left text-sm transition-colors ${
                  i === templateIndex
                    ? "bg-primary/15 text-primary ring-1 ring-primary"
                    : "bg-white/50 text-rock hover:bg-white/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="primary">
          <Download className="h-4 w-4" />
          {"\u4e0b\u8f7d\u6d77\u62a5"}
        </Button>
        <Button variant="secondary">
          <Share2 className="h-4 w-4" />
          {"\u5206\u4eab\u5230\u5fae\u4fe1"}
        </Button>
        <Button variant="secondary">
          <ImageIcon className="h-4 w-4" />
          {"\u4fdd\u5b58\u56fe\u7247"}
        </Button>
      </div>
    </div>
  );
}
