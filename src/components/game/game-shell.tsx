"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GameCanvas } from "@/components/game/game-canvas";
import { JournalBook } from "@/components/game/journal-book";
import { PosterCard } from "@/components/game/poster-card";
import { GAME_ROUTES, TOTAL_FRAGMENT_COUNT, getRouteDefinition } from "@/game/data/routes";
import { onGameEvent } from "@/game/events";
import {
  getGameAudioEnabled,
  playSoftFeedback,
  setGameAudioEnabled,
} from "@/game/services/audio";
import {
  selectCollectedCount,
  selectCompletedCount,
  useActiveRouteId,
  useGameStore,
} from "@/game/store/use-game-store";
import type { RouteId } from "@/game/types";
import { cn } from "@/lib/utils";

const VALID_ROUTE_IDS = new Set<RouteId>(["xuanwu", "wutong", "zijin", "qinhuai"]);

function parseRouteParam(value: string | null): RouteId | null {
  if (!value || !VALID_ROUTE_IDS.has(value as RouteId)) return null;
  return value as RouteId;
}

export function GameShell() {
  const searchParams = useSearchParams();
  const routeFromUrl = parseRouteParam(searchParams.get("route"));
  const hydrate = useGameStore((state) => state.hydrate);
  const hydrated = useGameStore((state) => state.hydrated);
  const progress = useGameStore((state) => state.progress);
  const view = useGameStore((state) => state.view);
  const setView = useGameStore((state) => state.setView);
  const selectRoute = useGameStore((state) => state.selectRoute);
  const leaveRoute = useGameStore((state) => state.leaveRoute);
  const markFragmentFound = useGameStore((state) => state.markFragmentFound);
  const placeFragment = useGameStore((state) => state.placeFragment);
  const unplaceFragment = useGameStore((state) => state.unplaceFragment);
  const setSoundEnabled = useGameStore((state) => state.setSoundEnabled);
  const openPoster = useGameStore((state) => state.openPoster);
  const reset = useGameStore((state) => state.reset);
  const activeRouteId = useActiveRouteId();
  const [routeSession, setRouteSession] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stampBurst, setStampBurst] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const fromWindow = parseRouteParam(new URLSearchParams(window.location.search).get("route"));
    const routeId = routeFromUrl ?? fromWindow;
    if (!routeId) return;
    selectRoute(routeId);
    setRouteSession((value) => value + 1);
  }, [hydrated, routeFromUrl, selectRoute]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setGameAudioEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  useEffect(() => {
    const offFound = onGameEvent("fragment-found", ({ routeId, fragmentId }) => {
      markFragmentFound(routeId, fragmentId);
    });
    const offPlaced = onGameEvent("fragment-placed", ({ routeId, fragmentId }) => {
      const fragment = getRouteDefinition(routeId).fragments.find((item) => item.id === fragmentId);
      if (fragment) placeFragment(routeId, fragmentId, fragment.slotId);
    });
    const offUnplaced = onGameEvent("fragment-unplaced", ({ routeId, fragmentId }) => {
      unplaceFragment(routeId, fragmentId);
    });
    const offFeedback = onGameEvent("play-feedback", ({ tone }) => {
      playSoftFeedback(tone);
    });

    return () => {
      offFound();
      offPlaced();
      offUnplaced();
      offFeedback();
    };
  }, [markFragmentFound, placeFragment, unplaceFragment]);

  const collectedCount = selectCollectedCount(progress);
  const completedCount = selectCompletedCount(progress);
  const activeRoute = useMemo(() => getRouteDefinition(activeRouteId), [activeRouteId]);
  const activeRouteProgress = progress.routes[activeRoute.id];
  const foundCount = activeRouteProgress.fragments.filter((item) => item.found).length;
  const latestFound = [...activeRoute.fragments]
    .reverse()
    .find((fragment) =>
      activeRouteProgress.fragments.some((item) => item.id === fragment.id && item.found),
    );

  useEffect(() => {
    if (view !== "route" || !activeRouteProgress.completed) return;
    const timer = window.setTimeout(() => setDrawerOpen(true), 1100);
    return () => window.clearTimeout(timer);
  }, [view, activeRoute.id, activeRouteProgress.completed]);

  useEffect(() => {
    if (view === "route" && activeRouteProgress.completed) {
      setStampBurst(true);
      const timer = window.setTimeout(() => setStampBurst(false), 2400);
      return () => window.clearTimeout(timer);
    }
    setStampBurst(false);
  }, [view, activeRoute.id, activeRouteProgress.completed]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-center">
        <div className="rounded-[2rem] border border-white/70 bg-white/45 p-8 shadow-m">
          <p className="font-serif text-2xl text-ink">正在打开收纳所</p>
          <p className="mt-2 text-sm text-rock">把旧纸页轻轻展开...</p>
        </div>
      </div>
    );
  }

  return (
    <main data-view={view} className="min-h-screen overflow-hidden px-4 py-6 md:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 paper-texture" />

      <header className="mx-auto mb-6 flex w-full max-w-7xl flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/45 p-4 shadow-s backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-xs tracking-[0.28em] text-rock">
            宁可慢一点
          </Link>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink md:text-4xl">
            金陵风物收纳所
          </h1>
          <p className="mt-2 text-sm text-rock">
            已收纳 {collectedCount} / {TOTAL_FRAGMENT_COUNT} 件风物，完成{" "}
            {completedCount} / {GAME_ROUTES.length} 条慢游路线。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const nextEnabled = !getGameAudioEnabled();
              setSoundEnabled(nextEnabled);
            }}
            className={cn(
              "h-11 rounded-full px-4 text-sm transition-colors",
              progress.soundEnabled
                ? "bg-primary text-white"
                : "bg-white/60 text-rock hover:text-ink",
            )}
          >
            {progress.soundEnabled ? "声音已开" : "默认静音"}
          </button>
          <button
            type="button"
            onClick={() => setView("journal")}
            className="h-11 rounded-full bg-white/60 px-4 text-sm text-ink transition-colors hover:bg-white"
          >
            慢游札记
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-ink/15 px-4 text-sm text-ink transition-colors hover:bg-white/70"
          >
            返回网站
          </Link>
        </div>
      </header>

      {view === "hub" && (
        <HubView
          progress={progress}
          onSelectRoute={(routeId) => {
            setDrawerOpen(false);
            selectRoute(routeId);
            setRouteSession((session) => session + 1);
          }}
          onReset={() => void reset()}
        />
      )}

      {view === "route" && (
        <section className="relative mx-auto grid w-full max-w-7xl gap-5 pb-24 xl:grid-cols-[minmax(0,1fr)_320px] xl:pb-0">
          <div className="relative">
            <GameCanvas
              key={`${activeRoute.id}-${routeSession}`}
              route={activeRoute}
              progress={activeRouteProgress.fragments}
              reducedMotion={reducedMotion}
            />
            {stampBurst && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div
                  className="animate-stamp-pop rounded-full border-4 border-gold/80 bg-paper/90 px-8 py-6 font-serif text-3xl text-gold shadow-l"
                  style={{ transform: "rotate(-8deg)" }}
                >
                  {activeRoute.stamp}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-full bg-paper/95 px-5 py-3 text-sm shadow-l xl:hidden"
          >
            <span className="truncate text-ink">
              {foundCount}/3 ·{" "}
              {latestFound && !activeRouteProgress.completed
                ? `${latestFound.name} · ${latestFound.lore}`
                : activeRoute.gestureHint}
            </span>
            <span className="text-rock">{drawerOpen ? "收起" : "进度"}</span>
          </button>

          <aside
            className={cn(
              "z-30 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-m backdrop-blur xl:static xl:bg-white/55",
              "fixed inset-x-3 bottom-16 max-h-[70vh] overflow-y-auto xl:inset-auto xl:bottom-auto xl:max-h-none",
              drawerOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0 xl:pointer-events-auto xl:translate-y-0 xl:opacity-100",
            )}
          >
            <p className="text-xs tracking-[0.24em] text-rock">当前路线</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
              {activeRoute.title}
            </h2>
            <p className="mt-2 text-sm text-gold">{activeRoute.gestureHint}</p>
            <p className="mt-3 text-sm leading-7 text-rock">{activeRoute.subtitle}</p>

            <div className="mt-6 space-y-3">
              {activeRoute.fragments.map((fragment) => {
                const fragmentProgress = activeRouteProgress.fragments.find(
                  (item) => item.id === fragment.id,
                );
                const found = Boolean(fragmentProgress?.found);
                const placed = Boolean(fragmentProgress?.placed);

                return (
                  <div
                    key={fragment.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/50 px-3 py-2.5"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cloud/40">
                      {found ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fragment.image}
                          alt={fragment.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg text-rock/40">
                          {fragment.symbol}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{fragment.name}</p>
                      <p className="mt-0.5 text-xs text-rock">
                        {found ? fragment.lore : fragment.hint}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-rock">
                      {placed ? "已安放" : found ? "已找到" : "待发现"}
                    </span>
                  </div>
                );
              })}
            </div>

            {activeRouteProgress.completed && (
              <div className="mt-6 rounded-[1.5rem] bg-gold/10 p-4">
                <p className="font-serif text-xl text-ink">{activeRoute.stamp}</p>
                <p className="mt-2 font-serif text-lg text-ink">“{activeRoute.letter}”</p>
                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => openPoster(activeRoute.id)}
                    className="h-11 rounded-full bg-primary px-4 text-sm text-white transition-colors hover:bg-primary-hover"
                  >
                    生成纪念海报
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("journal")}
                    className="h-11 rounded-full bg-white/70 px-4 text-sm text-ink transition-colors hover:bg-white"
                  >
                    查看我的札记
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={leaveRoute}
              className="mt-5 h-11 w-full rounded-full border border-ink/15 px-4 text-sm text-ink transition-colors hover:bg-white/70"
            >
              返回收纳所
            </button>
          </aside>
        </section>
      )}

      {view === "journal" && <JournalBook />}
      {view === "poster" && <PosterCard />}
    </main>
  );
}

interface HubViewProps {
  progress: ReturnType<typeof useGameStore.getState>["progress"];
  onSelectRoute: (routeId: RouteId) => void;
  onReset: () => void;
}

function HubView({ progress, onSelectRoute, onReset }: HubViewProps) {
  return (
    <section className="mx-auto w-full max-w-7xl rounded-[2.5rem] border border-white/70 bg-white/45 p-5 shadow-l backdrop-blur md:p-8">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-paper/70 p-6">
          <p className="text-xs tracking-[0.3em] text-rock">COLLECTION HOUSE</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink">
            把路上的风，
            <br />
            轻轻收进一页纸里。
          </h2>
          <p className="mt-5 text-sm leading-7 text-rock">
            选择一段南京慢游记忆，找到三件风物，再把它们安放进属于你的金陵慢游札记。这里没有倒计时，也没有失败。
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-6 rounded-full px-1 text-sm text-rock transition-colors hover:text-ink"
          >
            重置本地收纳进度
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAME_ROUTES.map((route) => {
            const routeProgress = progress.routes[route.id];
            const placedCount = routeProgress.fragments.filter((fragment) => fragment.placed).length;

            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onSelectRoute(route.id)}
                className="group relative min-h-56 overflow-hidden rounded-[2rem] border border-white/70 p-5 text-left shadow-s transition duration-300 hover:-translate-y-1 hover:shadow-m"
                style={{ backgroundColor: route.palette.soft }}
              >
                <div
                  className="absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-30 transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: route.palette.accent }}
                />
                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="w-fit rounded-full border border-current px-3 py-1 text-xs"
                      style={{ color: route.palette.accent }}
                    >
                      {routeProgress.completed ? route.stamp : `${placedCount} / 3`}
                    </span>
                    <span
                      className="h-10 w-10 rounded-full"
                      style={{
                        background: `conic-gradient(${route.palette.accent} ${(placedCount / 3) * 360}deg, rgba(255,255,255,0.55) 0deg)`,
                      }}
                      aria-hidden
                    />
                  </div>
                  <h3
                    className="mt-6 font-serif text-2xl font-semibold"
                    style={{ color: route.palette.ink }}
                  >
                    {route.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-rock">{route.subtitle}</p>
                  {routeProgress.completed && (
                    <p
                      className="mt-3 font-serif text-lg opacity-80"
                      style={{ color: route.palette.accent, transform: "rotate(-6deg)" }}
                    >
                      {route.stamp}
                    </p>
                  )}
                  <p className="mt-auto text-sm font-medium" style={{ color: route.palette.ink }}>
                    {routeProgress.completed ? "再次翻看这一页 →" : "开始收纳 →"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
