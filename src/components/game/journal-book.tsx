"use client";

import { GAME_ROUTES, TOTAL_FRAGMENT_COUNT } from "@/game/data/routes";
import {
  selectCollectedCount,
  selectCompletedCount,
  useGameStore,
} from "@/game/store/use-game-store";

export function JournalBook() {
  const progress = useGameStore((state) => state.progress);
  const setView = useGameStore((state) => state.setView);
  const selectRoute = useGameStore((state) => state.selectRoute);
  const openPoster = useGameStore((state) => state.openPoster);
  const collectedCount = selectCollectedCount(progress);
  const completedCount = selectCompletedCount(progress);

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[2rem] border border-white/70 bg-paper/90 p-5 shadow-l md:p-8">
      <div className="flex flex-col gap-3 border-b border-cloud/60 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-rock">JINLING SLOW JOURNAL</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">慢游札记</h2>
          <p className="mt-2 text-sm text-rock">
            已收纳 {collectedCount} / {TOTAL_FRAGMENT_COUNT} 件风物，完成{" "}
            {completedCount} / {GAME_ROUTES.length} 页。
          </p>
        </div>
        <button
          type="button"
          onClick={() => setView("hub")}
          className="h-11 rounded-full border border-ink/15 px-5 text-sm text-ink transition-colors hover:bg-white/70"
        >
          返回收纳所
        </button>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {GAME_ROUTES.map((route) => {
          const routeProgress = progress.routes[route.id];
          const completedAt = routeProgress.completedAt
            ? new Date(routeProgress.completedAt).toLocaleDateString("zh-CN")
            : "尚未完成";

          return (
            <article
              key={route.id}
              className="relative overflow-hidden rounded-[1.75rem] border border-white/70 p-5"
              style={{ backgroundColor: route.palette.soft }}
            >
              <div
                className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-25"
                style={{ backgroundColor: route.palette.accent }}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="font-serif text-xl font-semibold"
                      style={{ color: route.palette.ink }}
                    >
                      {route.title}
                    </h3>
                    <p className="mt-1 text-sm text-rock">{route.sceneMood}</p>
                  </div>
                  <span
                    className="rounded-full border border-current px-3 py-1 text-xs"
                    style={{ color: route.palette.accent }}
                  >
                    {routeProgress.completed ? route.stamp : "待收纳"}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {route.fragments.map((fragment) => {
                    const fragmentProgress = routeProgress.fragments.find(
                      (item) => item.id === fragment.id,
                    );
                    const found = fragmentProgress?.found;
                    const placed = fragmentProgress?.placed;

                    return (
                      <div
                        key={fragment.id}
                        className="flex min-h-28 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-white/35 p-2 text-center"
                        style={{
                          borderColor: placed
                            ? route.palette.accent
                            : "rgba(61,66,70,0.22)",
                        }}
                      >
                        {placed || found ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={fragment.image}
                            alt={fragment.name}
                            className={placed ? "h-16 w-16 rounded-xl object-cover" : "h-16 w-16 rounded-xl object-cover opacity-50"}
                          />
                        ) : (
                          <span className="font-serif text-3xl text-rock/25">{fragment.symbol}</span>
                        )}
                        <span className="mt-2 text-xs text-rock">{fragment.name}</span>
                      </div>
                    );
                  })}
                </div>

                <blockquote
                  className="mt-5 rounded-2xl bg-white/35 p-4 font-serif text-lg"
                  style={{ color: route.palette.ink }}
                >
                  “{routeProgress.completed ? route.letter : "这一页还留着一点空白。"}”
                </blockquote>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rock">
                  <span>完成日期：{completedAt}</span>
                  {routeProgress.completed ? (
                    <button
                      type="button"
                      onClick={() => openPoster(route.id)}
                      className="rounded-full bg-white/60 px-4 py-2 text-ink transition-colors hover:bg-white"
                    >
                      生成纪念海报
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectRoute(route.id)}
                      className="rounded-full bg-white/60 px-4 py-2 text-ink transition-colors hover:bg-white"
                    >
                      去这条路线收纳
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {completedCount === GAME_ROUTES.length && (
        <div className="mt-6 rounded-[1.75rem] border border-gold/30 bg-gold/10 p-5 text-center">
          <p className="font-serif text-2xl text-ink">金陵慢游探索者</p>
          <p className="mt-2 text-sm text-rock">
            你没有赶路，只是把南京慢慢收好了。
          </p>
        </div>
      )}
    </section>
  );
}
