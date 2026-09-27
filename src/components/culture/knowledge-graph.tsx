"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Core } from "cytoscape";
import { ExternalLink, Network, Search, UnfoldVertical } from "lucide-react";
import { CULTURE_GRAPH, getKnowledgeSources } from "@/lib/culture/graph";
import type { KnowledgeEntityType } from "@/lib/culture/types";

const TYPE_LABELS: Record<KnowledgeEntityType, string> = {
  place: "地点",
  theme: "文化主题",
  period: "历史时期",
  person: "人物",
  event: "事件",
  heritage: "文化遗产",
};

const TYPE_COLORS: Record<KnowledgeEntityType, string> = {
  place: "#8d3b2f",
  theme: "#b48a4a",
  period: "#6f7d62",
  person: "#6d5b7b",
  event: "#56748a",
  heritage: "#9b6b43",
};

const DEFAULT_TYPES: KnowledgeEntityType[] = ["place", "theme"];

export function KnowledgeGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<Core | null>(null);
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<KnowledgeEntityType[]>(DEFAULT_TYPES);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("theme:six-dynasties");

  const visibleIds = useMemo(() => {
    const ids = new Set(
      CULTURE_GRAPH.entities.filter((entity) => types.includes(entity.type)).map((entity) => entity.id),
    );
    for (const expandedId of expandedIds) {
      ids.add(expandedId);
      for (const claim of CULTURE_GRAPH.claims) {
        if (claim.subjectId === expandedId) ids.add(claim.objectId);
        if (claim.objectId === expandedId) ids.add(claim.subjectId);
      }
    }
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (normalized) {
      for (const entity of CULTURE_GRAPH.entities) {
        if ([entity.label, ...(entity.aliases ?? [])].some((value) => value.toLocaleLowerCase("zh-CN").includes(normalized))) {
          ids.add(entity.id);
        }
      }
    }
    return ids;
  }, [expandedIds, query, types]);

  const selected = CULTURE_GRAPH.entities.find((entity) => entity.id === selectedId) ?? null;
  const selectedClaims = selected
    ? CULTURE_GRAPH.claims.filter((claim) => claim.subjectId === selected.id || claim.objectId === selected.id)
    : [];
  const selectedSources = getKnowledgeSources([
    ...(selected?.sourceIds ?? []),
    ...selectedClaims.flatMap((claim) => claim.sourceIds),
  ]);

  useEffect(() => {
    let cancelled = false;
    async function renderGraph() {
      if (!containerRef.current) return;
      const { default: cytoscape } = await import("cytoscape");
      if (cancelled || !containerRef.current) return;
      coreRef.current?.destroy();
      const nodes = CULTURE_GRAPH.entities
        .filter((entity) => visibleIds.has(entity.id))
        .map((entity) => ({ data: { id: entity.id, label: entity.label, type: entity.type } }));
      const edges = CULTURE_GRAPH.claims
        .filter((claim) => visibleIds.has(claim.subjectId) && visibleIds.has(claim.objectId))
        .map((claim) => ({ data: { id: claim.id, source: claim.subjectId, target: claim.objectId } }));
      const cy = cytoscape({
        container: containerRef.current,
        elements: [...nodes, ...edges],
        minZoom: 0.35,
        maxZoom: 2.4,
        style: [
          {
            selector: "node",
            style: {
              label: "data(label)",
              "font-family": "serif",
              "font-size": 10,
              color: "#332f2a",
              "text-wrap": "wrap",
              "text-max-width": "82px",
              "text-valign": "bottom",
              "text-margin-y": 7,
              width: 24,
              height: 24,
              "background-color": (element) => TYPE_COLORS[element.data("type") as KnowledgeEntityType],
              "border-width": 3,
              "border-color": "#f5f1e8",
            },
          },
          {
            selector: "node:selected",
            style: { "border-color": "#cfaa65", "border-width": 5, width: 30, height: 30 },
          },
          {
            selector: "edge",
            style: {
              width: 1.2,
              "line-color": "#c8c1b4",
              "curve-style": "bezier",
              opacity: 0.65,
            },
          },
        ],
        layout: { name: "cose", animate: false, fit: true, padding: 34, nodeRepulsion: () => 6200 },
      });
      cy.on("tap", "node", (event) => setSelectedId(event.target.id()));
      coreRef.current = cy;
    }
    void renderGraph();
    return () => {
      cancelled = true;
      coreRef.current?.destroy();
      coreRef.current = null;
    };
  }, [visibleIds]);

  function toggleType(type: KnowledgeEntityType) {
    setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type]);
  }

  function expandSelected() {
    if (!selected) return;
    setExpandedIds((current) => current.includes(selected.id) ? current : [...current, selected.id]);
  }

  return (
    <section className="mt-16" aria-labelledby="knowledge-graph-title">
      <div className="flex items-center gap-3">
        <Network className="h-5 w-5 text-primary" aria-hidden="true" />
        <div>
          <h2 id="knowledge-graph-title" className="font-serif text-2xl font-semibold text-ink">南京文化知识图谱</h2>
          <p className="mt-1 text-sm text-rock">本地 JSON-LD · {CULTURE_GRAPH.entities.length} 个实体 · {CULTURE_GRAPH.claims.length} 条可追溯关系</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-white/70 bg-white/55 p-4 shadow-m md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-cloud bg-paper/80 px-3 py-2 lg:w-72">
            <Search className="h-4 w-4 shrink-0 text-rock" aria-hidden="true" />
            <span className="sr-only">搜索文化实体</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索地点、主题、人物…"
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-rock/60"
            />
          </label>
          <div className="flex flex-wrap gap-2" aria-label="实体类型筛选">
            {(Object.keys(TYPE_LABELS) as KnowledgeEntityType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${types.includes(type) ? "border-primary bg-primary text-paper" : "border-cloud bg-paper/60 text-rock"}`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 hidden gap-4 md:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
          <div ref={containerRef} className="h-[560px] rounded-2xl border border-cloud/70 bg-paper/70" aria-label="可缩放拖动的文化知识图谱" />
          <EntityDetails
            entity={selected}
            claims={selectedClaims}
            sources={selectedSources}
            onExpand={expandSelected}
          />
        </div>

        <div className="mt-5 space-y-5 md:hidden">
          {(Object.keys(TYPE_LABELS) as KnowledgeEntityType[])
            .filter((type) => types.includes(type))
            .map((type) => {
              const entities = CULTURE_GRAPH.entities.filter((entity) => entity.type === type && visibleIds.has(entity.id));
              if (!entities.length) return null;
              return (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-ink">{TYPE_LABELS[type]} · {entities.length}</h3>
                  <div className="mt-2 grid gap-2">
                    {entities.map((entity) => (
                      <button
                        type="button"
                        key={entity.id}
                        onClick={() => setSelectedId(entity.id)}
                        className="rounded-xl border border-cloud/70 bg-paper/70 px-3 py-2 text-left text-sm text-rock"
                      >
                        <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                        {entity.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          <EntityDetails entity={selected} claims={selectedClaims} sources={selectedSources} onExpand={expandSelected} />
        </div>
      </div>
    </section>
  );
}

function EntityDetails({
  entity,
  claims,
  sources,
  onExpand,
}: {
  entity: (typeof CULTURE_GRAPH.entities)[number] | null;
  claims: typeof CULTURE_GRAPH.claims;
  sources: ReturnType<typeof getKnowledgeSources>;
  onExpand: () => void;
}) {
  if (!entity) return <aside className="rounded-2xl bg-paper/70 p-5 text-sm text-rock">点击节点查看文化关系。</aside>;
  return (
    <aside className="rounded-2xl border border-cloud/70 bg-paper/70 p-5">
      <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{TYPE_LABELS[entity.type]}</p>
      <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{entity.label}</h3>
      {entity.summary && <p className="mt-2 text-sm leading-6 text-rock">{entity.summary}</p>}
      <button type="button" onClick={onExpand} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs text-paper">
        <UnfoldVertical className="h-3.5 w-3.5" aria-hidden="true" />
        展开一跳邻接实体
      </button>
      <div className="mt-5">
        <p className="text-xs font-semibold text-ink">相关关系</p>
        <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">
          {claims.slice(0, 10).map((claim) => (
            <li key={claim.id} className="rounded-lg bg-white/65 p-2 text-xs leading-5 text-rock">
              {claim.text}
              <span className="mt-1 block text-[10px] text-rock/65">
                {claim.status === "verified" ? "已核验事实" : "项目编目判断"} · {claim.evidenceLevel} · {claim.id} · {claim.lastReviewedAt}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <details className="mt-4 border-t border-cloud/70 pt-3">
        <summary className="cursor-pointer text-xs font-semibold text-ink">来源与更新时间（{sources.length}）</summary>
        <div className="mt-2 space-y-2">
          {sources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer" className="block text-xs leading-5 text-rock hover:text-primary">
              <span className="inline-flex items-start gap-1 font-medium text-ink">{source.title}<ExternalLink className="mt-1 h-3 w-3 shrink-0" /></span>
              <span className="block">{source.publisher} · 核验 {source.accessedAt} · 页面更新 {source.pageUpdatedAt ?? "未标注"}</span>
            </a>
          ))}
        </div>
      </details>
    </aside>
  );
}
