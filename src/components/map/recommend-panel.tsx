"use client";

import { Sparkles, X } from "lucide-react";
import { MAP_POIS } from "@/lib/map/pois";
import type { PlanningOptions } from "@/lib/map/planning";
import type { MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { DynamicPlanningControls } from "./dynamic-planning-controls";
import { PlanningControls } from "./planning-controls";
import { PlanningResults } from "./planning-results";

interface RecommendPanelProps {
  open: boolean;
  selectedIds: string[];
  shortest: MapRoute | null;
  scenic: MapRoute | null;
  activeId: string | null;
  planningOptions: PlanningOptions;
  replanMessage: string | null;
  weatherError: string | null;
  onClose: () => void;
  onToggle: (id: string) => void;
  onPlanningChange: (patch: Partial<PlanningOptions>) => void;
  onGenerate: () => void;
  onPickRoute: (route: MapRoute) => void;
  onApplyScenario: (id: NonNullable<PlanningOptions["scenarioId"]>) => void;
  onRefreshWeather: () => void;
}

export function RecommendPanel({
  open,
  selectedIds,
  shortest,
  scenic,
  activeId,
  planningOptions,
  replanMessage,
  weatherError,
  onClose,
  onToggle,
  onPlanningChange,
  onGenerate,
  onPickRoute,
  onApplyScenario,
  onRefreshWeather,
}: RecommendPanelProps) {
  if (!open) return null;

  const count = selectedIds.length;
  const openSelectedCount = selectedIds.filter(
    (id) => !planningOptions.closedPoiIds.includes(id),
  ).length;
  const originReady = planningOptions.originMode === "current"
    ? Boolean(planningOptions.currentLocation)
    : openSelectedCount > 0;
  const ready = count >= 2 && count <= 5 && openSelectedCount > 0 && originReady;

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
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
          "md:inset-auto md:right-6 md:top-20 md:w-[min(94vw,460px)] md:max-h-[min(84vh,760px)] md:rounded-3xl",
        )}
        role="dialog"
        aria-labelledby="recommend-title"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cloud md:hidden" />
        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                选择 2～5 个候选地点。系统会在时间、天气和开放状态的硬约束内动态取舍。
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

          <div className="mt-3">
            <p className="text-[10px] font-medium text-ink">固定验收场景</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {[
                ["rain-short", "雨天 45 分"],
                ["culture-closing", "六朝与闭馆"],
                ["weekend-night", "周末夜游"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onApplyScenario(id as NonNullable<PlanningOptions["scenarioId"]>)}
                  className={cn(
                    "rounded-lg px-1.5 py-2 text-[10px]",
                    planningOptions.scenarioId === id
                      ? "bg-gold text-white"
                      : "bg-white/65 text-rock hover:bg-white",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <PlanningControls
            options={planningOptions}
            selectedIds={selectedIds}
            onChange={onPlanningChange}
          />

          <DynamicPlanningControls
            options={planningOptions}
            weatherError={weatherError}
            onChange={onPlanningChange}
            onRefreshWeather={onRefreshWeather}
          />

          {shortest && scenic && (
            <PlanningResults
              shortest={shortest}
              scenic={scenic}
              activeId={activeId}
              timeBudgetMinutes={planningOptions.timeBudgetMinutes}
              replanMessage={replanMessage}
              onPickRoute={onPickRoute}
            />
          )}
          {!shortest && replanMessage && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-[10px] leading-relaxed text-amber-800" role="status">
              {replanMessage}
            </p>
          )}

          <details className="mt-3" open={!shortest && !scenic}>
            <summary className="cursor-pointer text-[10px] font-medium text-ink">
              {shortest && scenic ? "调整候选地点" : "选择候选地点"}
            </summary>
          <div className="mt-2 rounded-2xl bg-white/45 p-2.5">
            <p className="mb-1.5 text-[10px] font-medium text-ink">
              已选 {count}/5
            </p>
            {count === 0 ? (
              <p className="text-[11px] text-rock">还没选。点下面的景点即可加入。</p>
            ) : (
              <ol className="space-y-1">
                {selectedIds.map((id, i) => {
                  const poi = MAP_POIS.find((p) => p.id === id);
                  const closed = planningOptions.closedPoiIds.includes(id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-2 text-[11px] text-ink"
                    >
                      <span className={cn("min-w-0 flex-1 truncate", closed && "text-amber-700 line-through")}>
                        {i + 1}. {poi?.name ?? id}
                        {poi ? ` · ${poi.operatingHours.label}` : ""}
                      </span>
                      <span className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => onPlanningChange({
                            closedPoiIds: closed
                              ? planningOptions.closedPoiIds.filter((item) => item !== id)
                              : [...planningOptions.closedPoiIds, id],
                          })}
                          className={cn("text-[10px]", closed ? "text-primary" : "text-amber-700")}
                        >
                          {closed ? "恢复" : "临时关闭"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggle(id)}
                          className="text-[10px] text-rock hover:text-ink"
                        >
                          去掉
                        </button>
                      </span>
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
            {ready
              ? "生成两条规划路径"
              : count < 2
                ? `再选 ${Math.max(0, 2 - count)} 处`
                : "请确认路线起点"}
          </button>
          </details>
        </div>
      </div>
    </>
  );
}
