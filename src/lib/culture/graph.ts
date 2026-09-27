import graphJson from "@/data/nanjing-culture-knowledge.json";
import type {
  CultureCoverageMetrics,
  KnowledgeClaim,
  KnowledgeEntity,
  KnowledgeEntityType,
  KnowledgeGraphData,
  KnowledgeSource,
  RouteNarrative,
  RouteNarrativeBridge,
} from "./types";

export const CULTURE_GRAPH = graphJson as KnowledgeGraphData;

interface GraphIndex {
  entities: Map<string, KnowledgeEntity>;
  sources: Map<string, KnowledgeSource>;
  claims: Map<string, KnowledgeClaim>;
  claimsBySubject: Map<string, KnowledgeClaim[]>;
  neighbors: Map<string, Array<{ entityId: string; claimId: string }>>;
}

function append<T>(map: Map<string, T[]>, key: string, value: T): void {
  map.set(key, [...(map.get(key) ?? []), value]);
}

function createIndex(data: KnowledgeGraphData): GraphIndex {
  const claimsBySubject = new Map<string, KnowledgeClaim[]>();
  const neighbors = new Map<string, Array<{ entityId: string; claimId: string }>>();
  for (const claim of data.claims) {
    append(claimsBySubject, claim.subjectId, claim);
    append(neighbors, claim.subjectId, { entityId: claim.objectId, claimId: claim.id });
    append(neighbors, claim.objectId, { entityId: claim.subjectId, claimId: claim.id });
  }
  return {
    entities: new Map(data.entities.map((entity) => [entity.id, entity])),
    sources: new Map(data.sources.map((source) => [source.id, source])),
    claims: new Map(data.claims.map((claim) => [claim.id, claim])),
    claimsBySubject,
    neighbors,
  };
}

const INDEX = createIndex(CULTURE_GRAPH);

export function getKnowledgeEntity(id: string): KnowledgeEntity | undefined {
  return INDEX.entities.get(id);
}

export function getKnowledgeSource(id: string): KnowledgeSource | undefined {
  return INDEX.sources.get(id);
}

export function getKnowledgeClaim(id: string): KnowledgeClaim | undefined {
  return INDEX.claims.get(id);
}

export function getKnowledgeSources(ids: string[]): KnowledgeSource[] {
  return [...new Set(ids)].map(getKnowledgeSource).filter((source): source is KnowledgeSource => Boolean(source));
}

export function getKnowledgeClaimsForPoi(poiId: string): KnowledgeClaim[] {
  return [...(INDEX.claimsBySubject.get(`place:${poiId}`) ?? [])]
    .filter((claim) => claim.status === "verified" || claim.status === "interpretive")
    .sort((a, b) => {
      const rank = { authoritative: 0, corroborated: 1, curated: 2 } as const;
      return rank[a.evidenceLevel] - rank[b.evidenceLevel] || a.id.localeCompare(b.id);
    });
}

export function getPoiKnowledgeEntityIds(
  poiId: string,
  types?: KnowledgeEntityType[],
): string[] {
  return getKnowledgeClaimsForPoi(poiId)
    .map((claim) => INDEX.entities.get(claim.objectId))
    .filter((entity): entity is KnowledgeEntity => Boolean(entity))
    .filter((entity) => !types || types.includes(entity.type))
    .map((entity) => entity.id);
}

export function resolveCultureEntityIds(tags: string[]): string[] {
  return [...new Set(tags.flatMap((tag) => CULTURE_GRAPH.legacyTagMap[tag] ?? []))].sort();
}

export function getPoiCultureSummary(poiId: string): string {
  const claims = getKnowledgeClaimsForPoi(poiId).filter((claim) => claim.predicate !== "connectsTo");
  const labels = claims
    .map((claim) => INDEX.entities.get(claim.objectId)?.label)
    .filter((label): label is string => Boolean(label));
  const firstFact = claims.find((claim) => claim.evidenceLevel !== "curated")?.text ?? claims[0]?.text ?? "";
  return [`规范文化实体：${[...new Set(labels)].join("、")}`, firstFact].filter(Boolean).join("；");
}

function themeIdsForPois(poiIds: string[]): Set<string> {
  return new Set(poiIds.flatMap((poiId) => getPoiKnowledgeEntityIds(poiId, ["theme"])));
}

export function calculateCultureCoverage(
  routePoiIds: string[],
  candidatePoiIds: string[],
  focusEntityIds: string[] = [],
): CultureCoverageMetrics {
  const candidateThemes = themeIdsForPois(candidatePoiIds);
  const routeThemes = themeIdsForPois(routePoiIds);
  const focus = new Set(focusEntityIds);
  const weightOf = (themeId: string) => focus.has(themeId) ? 2 : 1;
  const denominatorWeight = [...candidateThemes].reduce((sum, themeId) => sum + weightOf(themeId), 0);
  const coveredThemeIds = [...candidateThemes].filter((themeId) => routeThemes.has(themeId)).sort();
  const uncoveredThemeIds = [...candidateThemes].filter((themeId) => !routeThemes.has(themeId)).sort();
  const coveredWeight = coveredThemeIds.reduce((sum, themeId) => sum + weightOf(themeId), 0);
  const coveredPeriodIds = [...new Set(routePoiIds.flatMap((poiId) => getPoiKnowledgeEntityIds(poiId, ["period"])))].sort();
  return {
    score: denominatorWeight ? Math.round((coveredWeight / denominatorWeight) * 100) : 0,
    coveredThemeIds,
    uncoveredThemeIds,
    coveredPeriodIds,
    denominatorWeight,
    coveredWeight,
  };
}

interface PathResult {
  entityIds: string[];
  claimIds: string[];
}

export function findVerifiedKnowledgePath(fromId: string, toId: string, maxHops = 3): PathResult | null {
  if (fromId === toId) return { entityIds: [fromId], claimIds: [] };
  const queue: PathResult[] = [{ entityIds: [fromId], claimIds: [] }];
  const visitedDepth = new Map<string, number>([[fromId, 0]]);
  while (queue.length) {
    const path = queue.shift()!;
    const current = path.entityIds[path.entityIds.length - 1];
    if (path.claimIds.length >= maxHops) continue;
    const neighbors = [...(INDEX.neighbors.get(current) ?? [])].sort(
      (a, b) => a.entityId.localeCompare(b.entityId) || a.claimId.localeCompare(b.claimId),
    );
    for (const neighbor of neighbors) {
      const claim = INDEX.claims.get(neighbor.claimId);
      if (!claim || claim.status !== "verified") continue;
      const depth = path.claimIds.length + 1;
      if ((visitedDepth.get(neighbor.entityId) ?? Infinity) < depth) continue;
      const next = {
        entityIds: [...path.entityIds, neighbor.entityId],
        claimIds: [...path.claimIds, neighbor.claimId],
      };
      if (neighbor.entityId === toId) return next;
      visitedDepth.set(neighbor.entityId, depth);
      queue.push(next);
    }
  }
  return null;
}

function bridgeFromPath(fromPoiId: string, toPoiId: string, path: PathResult): RouteNarrativeBridge | null {
  if (!path.claimIds.length) return null;
  const claims = path.claimIds.map(getKnowledgeClaim).filter((claim): claim is KnowledgeClaim => Boolean(claim));
  const direct = claims.find((claim) => claim.predicate === "connectsTo");
  const middleLabels = path.entityIds
    .slice(1, -1)
    .map((id) => getKnowledgeEntity(id)?.label)
    .filter((label): label is string => Boolean(label));
  const from = getKnowledgeEntity(`place:${fromPoiId}`)?.label ?? fromPoiId;
  const to = getKnowledgeEntity(`place:${toPoiId}`)?.label ?? toPoiId;
  return {
    fromPoiId,
    toPoiId,
    text: direct?.text ?? `${from}与${to}通过“${middleLabels.join("、")}”形成可核验的文化承接。`,
    claimIds: path.claimIds,
    sourceIds: [...new Set(claims.flatMap((claim) => claim.sourceIds))],
  };
}

export function buildRouteNarrative(
  poiIds: string[],
  focusEntityIds: string[] = [],
): RouteNarrative {
  const focus = new Set(focusEntityIds);
  const stops = poiIds.map((poiId) => {
    const placeEntityId = `place:${poiId}`;
    const claims = getKnowledgeClaimsForPoi(poiId)
      .filter((claim) => claim.predicate !== "connectsTo")
      .sort((a, b) => {
        const focusRank = Number(focus.has(b.objectId)) - Number(focus.has(a.objectId));
        if (focusRank) return focusRank;
        const evidenceRank = { authoritative: 0, corroborated: 1, curated: 2 } as const;
        return evidenceRank[a.evidenceLevel] - evidenceRank[b.evidenceLevel] || a.id.localeCompare(b.id);
      })
      .slice(0, 2);
    const editorial = CULTURE_GRAPH.editorials.find((item) => item.placeId === placeEntityId) ?? null;
    return {
      poiId,
      placeEntityId,
      title: INDEX.entities.get(placeEntityId)?.label ?? poiId,
      text: editorial?.text ?? claims.map((claim) => claim.text).join(""),
      evidence: claims.map((claim) => ({
        claimId: claim.id,
        sourceIds: claim.sourceIds,
        text: claim.text,
        evidenceLevel: claim.evidenceLevel,
        status: claim.status,
      })),
      editorialId: editorial?.id ?? null,
      expressionLabel: "项目原创表达" as const,
    };
  });
  const bridges: RouteNarrativeBridge[] = [];
  for (let index = 1; index < poiIds.length; index++) {
    const fromPoiId = poiIds[index - 1];
    const toPoiId = poiIds[index];
    const path = findVerifiedKnowledgePath(`place:${fromPoiId}`, `place:${toPoiId}`, 3);
    const bridge = path ? bridgeFromPath(fromPoiId, toPoiId, path) : null;
    if (bridge) bridges.push(bridge);
  }
  const claimIds = [
    ...stops.flatMap((stop) => stop.evidence.map((evidence) => evidence.claimId)),
    ...bridges.flatMap((bridge) => bridge.claimIds),
  ];
  const claims = claimIds.map(getKnowledgeClaim).filter((claim): claim is KnowledgeClaim => Boolean(claim));
  const reviewed = claims.map((claim) => claim.lastReviewedAt).sort();
  return {
    stops,
    bridges,
    sourceIds: [...new Set([
      ...stops.flatMap((stop) => stop.evidence.flatMap((evidence) => evidence.sourceIds)),
      ...bridges.flatMap((bridge) => bridge.sourceIds),
    ])],
    oldestReviewedAt: reviewed[0] ?? null,
    generatedAt: new Date().toISOString(),
  };
}

export function cultureGraphStats() {
  const typeCounts = Object.fromEntries(
    (["place", "theme", "period", "person", "event", "heritage"] as KnowledgeEntityType[])
      .map((type) => [type, CULTURE_GRAPH.entities.filter((entity) => entity.type === type).length]),
  );
  return {
    entities: CULTURE_GRAPH.entities.length,
    claims: CULTURE_GRAPH.claims.length,
    sources: CULTURE_GRAPH.sources.length,
    ...typeCounts,
  };
}
