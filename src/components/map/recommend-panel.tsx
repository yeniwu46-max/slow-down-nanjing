"use client";

import { Sparkles, X } from "lucide-react";
import { MAP_POIS } from "@/lib/map/pois";
import type { MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";

interface RecommendPanelProps {
  open: boolean;
  selectedIds: string[];
  shortest: MapRoute | null;
  scenic: MapRoute | null;
  activeId: string | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onGenerate: () => void;
  onPickRoute: (route: MapRoute) => void;
}

export function RecommendPanel({
  open,
  selectedIds,
  shortest,
  scenic,
  activeId,
  onClose,
  onToggle,
  onGenerate,
  onPickRoute,
}: RecommendPanelProps) {
  if (!open) return null;

  const count = selectedIds.length;
  const ready = count >= 2 && count <= 5;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30 bg-charcoal/40 md:hidden"
        aria-label="关闭推荐遮罩"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed z-40 flex flex-col glass-strong shadow-l",
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl",
          "md:inset-auto md:right-6 md:top-20 md:w-[min(92vw,380px)] md:max-h-[min(78vh,640px)] md:rounded-3xl",
        )}
        role="dialog"
        aria-labelledby="recommend-title"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cloud md:hidden" />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                id="recommend-title"
                className="flex items-center gap-1.5 font-serif text-base font-semibold text-ink"
              >
                <Sparkles className="h-4 w-4 text-gold" />
                智能推荐
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-rock">
                勾选 2～5 处，生成两条沿路折线：一条少走路，一条更慢、更愿意串湖与城墙。已标记「待前往」的点会尽量排在风景线前面。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-rock hover:bg-white/60"
              aria-label="关闭推荐"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 rounded-2xl bg-white/45 p-2.5">
            <p className="mb-1.5 text-[10px] font-medium text-ink">
              已选 {count}/5
            </p>
            {count === 0 ? (
              <p className="text-[11px] text-rock">还没选。点下面的景点即可加入。</p>
            ) : (
              <ol className="space-y-1">
                {selectedIds.map((id, i) => {
                  const poi = MAP_POIS.find((p) => p.id === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-2 text-[11px] text-ink"
                    >
                      <span className="truncate">
                        {i + 1}. {poi?.name ?? id}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggle(id)}
                        className="shrink-0 text-rock hover:text-ink"
                      >
                        去掉
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {MAP_POIS.map((poi) => {
              const on = selectedIds.includes(poi.id);
              const locked = !on && count >= 5;
              return (
                <button
                  key={poi.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onToggle(poi.id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] transition-colors",
                    on
                      ? "bg-primary text-white"
                      : "bg-white/60 text-rock hover:bg-white",
                    locked && "cursor-not-allowed opacity-40",
                  )}
                >
                  {poi.name}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!ready}
            onClick={onGenerate}
            className="mt-3 w-full rounded-full bg-primary py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            {ready ? "生成两条规划路径" : `再选 ${Math.max(0, 2 - count)} 处`}
          </button>

          {shortest && scenic && (
            <div className="mt-3 space-y-2 pb-4">
              {[shortest, scenic].map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onPickRoute(route)}
                  className={cn(
                    "w-full rounded-2xl p-3 text-left transition-colors",
                    activeId === route.id
                      ? "bg-primary/15 ring-1 ring-primary"
                      : "bg-white/55 hover:bg-white/80",
                  )}
                >
                  <p className="text-sm font-medium text-ink">{route.name}</p>
                  <p className="mt-0.5 text-[11px] text-gold">
                    {route.duration} · {route.distance}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-rock">
                    {route.tagline}
                  </p>
                  <p className="mt-1 text-[10px] text-rock">
                    {(route.poiIds ?? [])
                      .map((id) => MAP_POIS.find((p) => p.id === id)?.name)
                      .filter(Boolean)
                      .join(" → ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
