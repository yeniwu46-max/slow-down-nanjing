"use client";

import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { GAME_ROUTES } from "@/game/data/routes";
import { useGameStore } from "@/game/store/use-game-store";

export function PosterCard() {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [saving, setSaving] = useState(false);
  const progress = useGameStore((state) => state.progress);
  const selectedPosterRouteId = useGameStore((state) => state.selectedPosterRouteId);
  const setView = useGameStore((state) => state.setView);

  const route = useMemo(() => {
    const completedRoute = GAME_ROUTES.find(
      (item) => progress.routes[item.id].completed,
    );
    return (
      GAME_ROUTES.find((item) => item.id === selectedPosterRouteId) ??
      completedRoute ??
      GAME_ROUTES[0]
    );
  }, [progress.routes, selectedPosterRouteId]);

  const routeProgress = progress.routes[route.id];

  async function handleSave() {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: route.palette.soft,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${route.stamp}-金陵风物收纳所.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
      <div
        ref={cardRef}
        className="relative aspect-[3/5] w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-white/70 p-8 shadow-l"
        style={{
          backgroundColor: route.palette.soft,
          color: route.palette.ink,
        }}
      >
        <div
          className="absolute -right-20 top-10 h-56 w-56 rounded-full opacity-25"
          style={{ backgroundColor: route.palette.accent }}
        />
        <div
          className="absolute bottom-16 left-1/2 h-40 w-[120%] -translate-x-1/2 rounded-[50%] opacity-20"
          style={{ backgroundColor: route.palette.accent }}
        />

        <div className="relative flex h-full flex-col">
          <p className="text-xs tracking-[0.32em] opacity-70">宁可慢一点</p>
          <h2 className="mt-8 font-serif text-3xl font-semibold leading-tight">
            {route.title}
          </h2>
          <p className="mt-3 text-sm opacity-72">{route.sceneMood}</p>

          <div className="mt-12 grid grid-cols-3 gap-3">
            {route.fragments.map((fragment) => {
              const placed = routeProgress.fragments.find(
                (item) => item.id === fragment.id,
              )?.placed;

              return (
                <div
                  key={fragment.id}
                  className="flex aspect-square flex-col items-center justify-center rounded-3xl bg-white/35 text-center"
                >
                  {placed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fragment.image}
                      alt={fragment.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="font-serif text-4xl opacity-30">{fragment.symbol}</span>
                  )}
                  <span className="mt-2 text-xs opacity-70">{fragment.name}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto">
            <div className="inline-flex rounded-full border border-current px-4 py-1 text-sm opacity-75">
              {route.stamp}
            </div>
            <p className="mt-5 font-serif text-2xl leading-relaxed">“{route.letter}”</p>
            <p className="mt-5 text-xs tracking-[0.24em] opacity-60">
              JINLING SLOW COLLECTION
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/70 bg-white/55 p-5 shadow-m">
        <h3 className="font-serif text-2xl text-ink">纪念海报</h3>
        <p className="mt-2 text-sm leading-7 text-rock">
          海报仅包含路线名、风物拼贴、城市短笺和项目名，不包含姓名、定位或其他隐私信息。
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !routeProgress.completed}
            className="h-12 rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:bg-cloud disabled:text-rock"
          >
            {saving ? "正在生成图片..." : "保存图片"}
          </button>
          <button
            type="button"
            onClick={() => setView("journal")}
            className="h-12 rounded-full border border-ink/15 px-5 text-sm text-ink transition-colors hover:bg-white/70"
          >
            返回慢游札记
          </button>
          <button
            type="button"
            onClick={() => setView("hub")}
            className="h-12 rounded-full px-5 text-sm text-rock transition-colors hover:text-ink"
          >
            返回收纳所
          </button>
        </div>
      </div>
    </section>
  );
}
