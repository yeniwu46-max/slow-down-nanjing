import type { KnowledgeGraphData } from "./types";

export interface KnowledgeValidationResult {
  errors: string[];
  warnings: string[];
  stats: {
    places: number;
    themes: number;
    periods: number;
    peopleEventsHeritage: number;
    claims: number;
    sources: number;
  };
}
export function validateKnowledgeGraph(
  graph: KnowledgeGraphData,
  now = new Date(),
  staleAfterDays = 365,
): KnowledgeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entityIds = new Set(graph.entities.map((entity) => entity.id));
  const sourceIds = new Set(graph.sources.map((source) => source.id));
  const claimIds = new Set(graph.claims.map((claim) => claim.id));
  const referenced = new Set<string>();

  if (entityIds.size !== graph.entities.length) errors.push("存在重复实体 ID");
  if (sourceIds.size !== graph.sources.length) errors.push("存在重复来源 ID");
  if (claimIds.size !== graph.claims.length) errors.push("存在重复关系 ID");

  for (const source of graph.sources) {
    try {
      const url = new URL(source.url);
      if (!/^https?:$/.test(url.protocol)) errors.push(`来源 ${source.id} 不是 HTTP(S) URL`);
    } catch {
      errors.push(`来源 ${source.id} URL 无效`);
    }
  }

  for (const entity of graph.entities) {
    if (!entity.sourceIds.length) errors.push(`实体 ${entity.id} 缺失来源`);
    for (const sourceId of entity.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`实体 ${entity.id} 引用了未知来源 ${sourceId}`);
    }
    const ageDays = (now.getTime() - new Date(`${entity.lastReviewedAt}T00:00:00Z`).getTime()) / 86_400_000;
    if (ageDays > staleAfterDays) warnings.push(`实体 ${entity.id} 已超过 ${staleAfterDays} 天未核验`);
  }

  for (const claim of graph.claims) {
    referenced.add(claim.subjectId);
    referenced.add(claim.objectId);
    if (!entityIds.has(claim.subjectId)) errors.push(`关系 ${claim.id} 主体不存在`);
    if (!entityIds.has(claim.objectId)) errors.push(`关系 ${claim.id} 客体不存在`);
    if (!claim.sourceIds.length) errors.push(`关系 ${claim.id} 缺失来源`);
    for (const sourceId of claim.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`关系 ${claim.id} 引用了未知来源 ${sourceId}`);
    }
    const ageDays = (now.getTime() - new Date(`${claim.lastReviewedAt}T00:00:00Z`).getTime()) / 86_400_000;
    if (ageDays > staleAfterDays) warnings.push(`关系 ${claim.id} 已超过 ${staleAfterDays} 天未核验`);
  }

  for (const entity of graph.entities) {
    if (entity.type !== "place" && !referenced.has(entity.id)) warnings.push(`孤立实体 ${entity.id}`);
  }

  const places = graph.entities.filter((entity) => entity.type === "place");
  for (const place of places) {
    const claims = graph.claims.filter((claim) => claim.subjectId === place.id && claim.predicate !== "connectsTo");
    const dimensions = new Set(
      claims.map((claim) => graph.entities.find((entity) => entity.id === claim.objectId)?.type).filter(Boolean),
    );
    if (claims.length < 3) errors.push(`地点 ${place.id} 只有 ${claims.length} 条文化关系`);
    if (dimensions.size < 2) errors.push(`地点 ${place.id} 文化维度不足 2 个`);
  }

  const stats = {
    places: places.length,
    themes: graph.entities.filter((entity) => entity.type === "theme").length,
    periods: graph.entities.filter((entity) => entity.type === "period").length,
    peopleEventsHeritage: graph.entities.filter((entity) => ["person", "event", "heritage"].includes(entity.type)).length,
    claims: graph.claims.length,
    sources: graph.sources.length,
  };
  if (stats.places !== 23) errors.push(`地点实体应为 23 个，当前为 ${stats.places}`);
  if (stats.claims < 90) errors.push(`文化关系少于 90 条，当前为 ${stats.claims}`);
  if (stats.themes < 8) errors.push(`文化主题少于 8 个，当前为 ${stats.themes}`);
  if (stats.periods < 6) errors.push(`历史时期少于 6 个，当前为 ${stats.periods}`);
  if (stats.peopleEventsHeritage < 15) errors.push(`人物、事件或遗产实体少于 15 个，当前为 ${stats.peopleEventsHeritage}`);
  return { errors, warnings, stats };
}
