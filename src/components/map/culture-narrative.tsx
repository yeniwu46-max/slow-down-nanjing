"use client";

import { BookOpenText, ChevronRight, ExternalLink, Link2 } from "lucide-react";
import {
  getKnowledgeEntity,
  getKnowledgeSources,
} from "@/lib/culture/graph";
import type { MapRoute } from "@/lib/map/types";

function entityLabels(ids: string[]): string[] {
  return ids.map((id) => getKnowledgeEntity(id)?.label).filter((label): label is string => Boolean(label));
}

export function CultureNarrative({ route }: { route: MapRoute }) {
  const metrics = route.metrics;
  const narrative = route.narrative;
  if (!metrics || !narrative) return null;
  const covered = entityLabels(metrics.coveredCultureThemeIds);
  const uncovered = entityLabels(metrics.uncoveredCultureThemeIds);
  const periods = entityLabels(metrics.coveredCulturePeriodIds);
  const sources = getKnowledgeSources(narrative.sourceIds);
  const bridgesByDestination = new Map(narrative.bridges.map((bridge) => [bridge.toPoiId, bridge]));

  return (
    <section className="mt-3 border-t border-cloud/80 pt-3" aria-label={`${route.name}文化叙事链`}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink">
          <BookOpenText className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          文化叙事链
        </p>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
          主题覆盖 {metrics.cultureCoverageScore}%
        </span>
      </div>

      <div className="mt-2 rounded-xl bg-paper/70 p-2.5 text-[9px] leading-relaxed text-rock">
        <p><span className="font-medium text-ink">已覆盖：</span>{covered.join("、") || "暂无"}</p>
        <p className="mt-1"><span className="font-medium text-ink">未覆盖：</span>{uncovered.join("、") || "候选主题已全部覆盖"}</p>
        <p className="mt-1"><span className="font-medium text-ink">时期：</span>{periods.join("、") || "暂无"}</p>
      </div>

      <ol className="mt-3 space-y-2.5">
        {narrative.stops.map((stop, index) => {
          const bridge = bridgesByDestination.get(stop.poiId);
          return (
            <li key={stop.poiId}>
              {bridge && (
                <div className="mb-2 flex gap-2 rounded-lg border border-gold/20 bg-gold/10 px-2.5 py-2 text-[9px] leading-relaxed text-rock">
                  <Link2 className="mt-0.5 h-3 w-3 shrink-0 text-gold" aria-hidden="true" />
                  <span>{bridge.text}</span>
                </div>
              )}
              <div className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[9px] font-semibold text-paper">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-ink">{stop.title}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-rock">{stop.text}</p>
                  <span className="mt-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[8px] font-medium text-primary">
                    {stop.expressionLabel}
                  </span>
                  <details className="mt-1.5 rounded-lg border border-cloud/70 bg-white/50 px-2.5 py-1.5">
                    <summary className="cursor-pointer text-[9px] font-medium text-ink">查看事实依据（{stop.evidence.length}）</summary>
                    <ul className="mt-1.5 space-y-1.5">
                      {stop.evidence.map((evidence) => (
                        <li key={evidence.claimId} className="text-[9px] leading-relaxed text-rock">
                          <span className="font-medium text-ink">
                            {evidence.status === "verified" ? "事实依据：" : "项目编目依据："}
                          </span>{evidence.text}
                          <span className="ml-1 text-rock/70">[{evidence.claimId}]</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <details className="mt-3 rounded-xl border border-cloud/70 bg-white/55 p-2.5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[9px] font-medium text-ink">
          <span>文化资料来源与核验日期（{sources.length}）</span>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </summary>
        <div className="mt-2 space-y-2">
          {sources.map((source) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg bg-paper/80 p-2 text-[9px] leading-relaxed text-rock hover:text-primary"
            >
              <span className="flex items-start gap-1 font-medium text-ink">
                {source.title}
                <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              </span>
              <span>{source.publisher} · 核验 {source.accessedAt} · 页面更新 {source.pageUpdatedAt ?? "未标注"}</span>
            </a>
          ))}
          <p className="text-[8px] leading-relaxed text-rock/70">
            最早事实核验日期：{route.cultureOldestReviewedAt ?? "未记录"}。页面未标注更新时间时保留“未标注”，不作推测。
          </p>
        </div>
      </details>
    </section>
  );
}
