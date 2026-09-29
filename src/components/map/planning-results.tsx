"use client";

import { BadgeInfo, Check, Clock3, RefreshCw } from "lucide-react";
import { MAP_POIS } from "@/lib/map/pois";
import type { AlgorithmRouteSummary, MapRoute } from "@/lib/map/types";
import { cn } from "@/lib/utils";
import { CultureNarrative } from "./culture-narrative";

interface PlanningResultsProps {
  shortest: MapRoute;
  scenic: MapRoute;
  activeId: string | null;
  timeBudgetMinutes: number;
  replanMessage: string | null;
  onPickRoute: (route: MapRoute) => void;
}

function poiName(id: string): string {
  return MAP_POIS.find((poi) => poi.id === id)?.name ?? id;
}

function RouteResultCard({
  route,
  active,
  budget,
  onPick,
}: {
  route: MapRoute;
  active: boolean;
  budget: number;
  onPick: () => void;
}) {
  const metrics = route.metrics!;
  const totalMinutes = metrics.walkingMinutes + metrics.stayMinutes + metrics.waitMinutes;
  return (
    <article
      className={cn(
        "rounded-2xl border p-3",
        active ? "border-primary bg-primary/10" : "border-white/80 bg-white/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">{route.name}</h3>
          <p className="mt-0.5 text-[10px] leading-relaxed text-rock">{route.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onPick}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium",
            active ? "bg-primary text-white" : "bg-white text-ink hover:bg-paper",
          )}
        >
          {active ? <span className="inline-flex items-center gap-1"><Check className="h-3 w-3" />当前</span> : "查看"}
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-white/65 px-1 py-2">
          <dt className="text-[9px] text-rock">总距离</dt>
          <dd className="mt-0.5 text-[11px] font-medium text-ink">{metrics.distanceKm.toFixed(1)} km</dd>
        </div>
        <div className="rounded-lg bg-white/65 px-1 py-2">
          <dt className="text-[9px] text-rock">步行时间</dt>
          <dd className="mt-0.5 text-[11px] font-medium text-ink">{metrics.walkingMinutes} 分钟</dd>
        </div>
        <div className="rounded-lg bg-white/65 px-1 py-2">
          <dt className="text-[9px] text-rock">游览时间</dt>
          <dd className="mt-0.5 text-[11px] font-medium text-ink">{metrics.stayMinutes} 分钟</dd>
        </div>
      </dl>

      <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-primary">
        <Clock3 className="h-3 w-3" aria-hidden="true" />
        共 {totalMinutes} 分钟，预计 {route.completionTime} 完成
        {totalMinutes <= budget ? "，预算内" : "，超出预算"}
      </p>
      <div className="mt-3">
        <p className="text-[10px] font-medium text-ink">路线顺序</p>
        <ol className="mt-1.5 space-y-1" aria-label={`${route.name}路线顺序`}>
          {(route.scheduledStops ?? []).map((stop, index) => (
            <li key={stop.poiId} className="flex items-baseline gap-2 text-[10px] text-rock">
              <span className="w-10 shrink-0 font-medium text-primary">
                {String(Math.floor(stop.arrivalMinutes / 60) % 24).padStart(2, "0")}:
                {String(stop.arrivalMinutes % 60).padStart(2, "0")}
              </span>
              <span>
                {index + 1}. {poiName(stop.poiId)} · 停留 {stop.stayMinutes} 分钟
                {stop.waitMinutes ? ` · 等候 ${stop.waitMinutes} 分钟` : ""}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-3 border-t border-cloud/80 pt-2">
        <p className="flex items-center gap-1 text-[10px] font-medium text-ink">
          <BadgeInfo className="h-3 w-3 text-primary" aria-hidden="true" />
          推荐理由
        </p>
        <ul className="mt-1.5 space-y-1.5">
          {(route.explanations ?? []).map((explanation) => (
            <li key={explanation.id} className="flex gap-1.5 text-[10px] leading-relaxed text-rock">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  explanation.tone === "caution" ? "bg-amber-600" : "bg-primary",
                )}
                aria-hidden="true"
              />
              <span>{explanation.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <CultureNarrative route={route} />
    </article>
  );
}

function AlgorithmColumn({ summary }: { summary: AlgorithmRouteSummary }) {
  return (
    <article className="min-w-0 rounded-xl border border-cloud/70 bg-white/65 p-2.5">
      <p className="text-[10px] font-semibold text-ink">{summary.label}</p>
      <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-rock">
        <div><dt className="inline">地点 </dt><dd className="inline font-medium text-ink">{summary.poiIds.length} 个</dd></div>
        <div><dt className="inline">总时长 </dt><dd className="inline font-medium text-ink">{summary.totalMinutes} 分</dd></div>
        <div><dt className="inline">步行 </dt><dd className="inline font-medium text-ink">{summary.walkingMinutes} 分</dd></div>
        <div><dt className="inline">距离 </dt><dd className="inline font-medium text-ink">{summary.distanceKm.toFixed(1)} km</dd></div>
      </dl>
      <p className={cn("mt-1 text-[9px] font-medium", summary.feasible ? "text-primary" : "text-amber-700")}>
        {summary.feasible ? "可行" : "不可行"}
      </p>
    </article>
  );
}

export function PlanningResults({
  shortest,
  scenic,
  activeId,
  timeBudgetMinutes,
  replanMessage,
  onPickRoute,
}: PlanningResultsProps) {
  const comparison = [
    ["距离", `${shortest.metrics!.distanceKm.toFixed(1)} km`, `${scenic.metrics!.distanceKm.toFixed(1)} km`],
    ["步行", `${shortest.metrics!.walkingMinutes} 分`, `${scenic.metrics!.walkingMinutes} 分`],
    ["游览", `${shortest.metrics!.stayMinutes} 分`, `${scenic.metrics!.stayMinutes} 分`],
    ["等候", `${shortest.metrics!.waitMinutes} 分`, `${scenic.metrics!.waitMinutes} 分`],
    ["景观", String(shortest.metrics!.scenicScore), String(scenic.metrics!.scenicScore)],
    ["拥挤成本", String(shortest.metrics!.crowdCost), String(scenic.metrics!.crowdCost)],
    ["文本匹配", `${shortest.metrics!.semanticMatchScore ?? 0}/100`, `${scenic.metrics!.semanticMatchScore ?? 0}/100`],
    ["文化覆盖", `${shortest.metrics!.cultureCoverageScore}%`, `${scenic.metrics!.cultureCoverageScore}%`],
  ];
  const algorithmComparison = shortest.algorithmComparison;

  return (
    <section className="mt-3 space-y-3" aria-labelledby="route-results-title">
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5" role="status">
        <p id="route-results-title" className="flex items-center gap-1 text-[10px] font-medium text-primary">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {replanMessage ?? "路线已生成"}
        </p>
      </div>

      <RouteResultCard
        route={shortest}
        active={activeId === shortest.id}
        budget={timeBudgetMinutes}
        onPick={() => onPickRoute(shortest)}
      />
      <RouteResultCard
        route={scenic}
        active={activeId === scenic.id}
        budget={timeBudgetMinutes}
        onPick={() => onPickRoute(scenic)}
      />

      <div className="rounded-xl bg-white/55 p-3">
        <p className="text-[10px] font-medium text-ink">两条路线量化对比</p>
        <table className="mt-2 w-full text-left text-[10px] text-rock">
          <thead>
            <tr className="border-b border-cloud/70">
              <th className="pb-1 font-medium">指标</th>
              <th className="pb-1 font-medium">效率优先</th>
              <th className="pb-1 font-medium">体验优先</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map(([label, shortValue, scenicValue]) => (
              <tr key={label} className="border-b border-cloud/40 last:border-0">
                <th className="py-1.5 font-normal">{label}</th>
                <td className="py-1.5">{shortValue}</td>
                <td className="py-1.5">{scenicValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {algorithmComparison && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
          <p className="text-[10px] font-semibold text-ink">算法对照</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <AlgorithmColumn summary={algorithmComparison.baseline} />
            <AlgorithmColumn summary={algorithmComparison.intelligent} />
            <AlgorithmColumn summary={algorithmComparison.optimal} />
          </div>
          <p className="mt-2 text-[9px] leading-relaxed text-rock">
            {algorithmComparison.visitedGap > 0
              ? `最优验证路线可多完成 ${algorithmComparison.visitedGap} 个地点；智能路线会据此提示调整。`
              : algorithmComparison.optimalityGapPercent == null
                ? "两者覆盖地点数不同，不计算用时最优差距。"
                : `智能路线与最短可行解的总用时差距为 ${algorithmComparison.optimalityGapPercent}%。`}
          </p>
        </div>
      )}

    </section>
  );
}
