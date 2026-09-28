import type { WeatherCondition } from "../weather/types";
import type { SemanticIntent } from "../semantic/types";
import {
  buildRouteNarrative,
  calculateCultureCoverage,
  getKnowledgeEntity,
  resolveCultureEntityIds,
} from "../culture/graph";
import {
  solveBaselineOrder,
  solveExactTimeWindowRoute,
  type ExactOptimizationProblem,
  type ExactOptimizationSolution,
} from "../optimization/exact-solver";
import {
  getWalkingMatrixLeg,
  WALKING_MATRIX,
  walkingTimeMatrixMinutes,
} from "../routing/walking-matrix";
import { coordsDistanceKm } from "./geo";
import { getPoiById } from "./pois";
import { alongRoadPath, type RoadPath, type RoadPathMetrics, type RouteMode } from "./road-graph";
import type {
  AlgorithmRouteSummary,
  MapPoi,
  MapRoute,
  RouteAlgorithmComparison,
  RouteExplanation,
  RouteMetrics,
  ScheduledStop,
} from "./types";

export interface RecommendationOptions {
  startId?: string | null;
  preference?: "efficiency" | "scenery" | "culture";
  timeBudgetMinutes: number;
  walkingFactor: number;
  weatherCondition: WeatherCondition;
  departureTimeMinutes: number;
  closedPoiIds?: string[];
  avoidCrowds?: boolean;
  nightMode?: boolean;
  cultureFocusTags?: string[];
  cultureFocusEntityIds?: string[];
  dataUpdatedAt: string;
  dataStatus: string;
  originCoordinates?: { lat: number; lng: number } | null;
  semanticIntent?: SemanticIntent | null;
  featureFlags?: Partial<PlannerFeatureFlags>;
}

export interface PlannerFeatureFlags {
  semanticPreference: boolean;
  cultureGraphScoring: boolean;
  weatherAdaptation: boolean;
}

export const DEFAULT_PLANNER_FEATURE_FLAGS: PlannerFeatureFlags = {
  semanticPreference: true,
  cultureGraphScoring: true,
  weatherAdaptation: true,
};

function resolveFeatureFlags(options: RecommendationOptions): PlannerFeatureFlags {
  return { ...DEFAULT_PLANNER_FEATURE_FLAGS, ...options.featureFlags };
}

interface Candidate {
  order: MapPoi[];
  path: RoadPath;
  km: number;
  reversals: number;
  planned: number;
  stayMinutes: number[];
  scheduledStops: ScheduledStop[];
  totalMinutes: number;
  walkingMinutes: number;
  waitMinutes: number;
  rainyScore: number;
  sunnyScore: number;
  cultureCoverageScore: number;
  cultureCoverage: ReturnType<typeof calculateCultureCoverage>;
  semanticScore: number;
}

function orderedSelections<T>(items: T[]): T[][] {
  const result: T[][] = [];
  const visit = (prefix: T[], remaining: T[]) => {
    if (prefix.length) result.push(prefix);
    remaining.forEach((item, index) => {
      visit([...prefix, item], remaining.slice(0, index).concat(remaining.slice(index + 1)));
    });
  };
  visit([], items);
  return result;
}

function keyOf(order: MapPoi[]): string {
  return order.map((poi) => poi.id).join(">");
}

function headingReversals(coords: [number, number][]): number {
  let count = 0;
  for (let index = 2; index < coords.length; index++) {
    const ax = coords[index - 1][0] - coords[index - 2][0];
    const ay = coords[index - 1][1] - coords[index - 2][1];
    const bx = coords[index][0] - coords[index - 1][0];
    const by = coords[index][1] - coords[index - 1][1];
    const magnitude = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (magnitude > 0 && (ax * bx + ay * by) / magnitude < -0.35) count += 1;
  }
  return count;
}

function plannedFrontScore(order: MapPoi[], planned: Set<string>): number {
  return order.reduce(
    (score, poi, index) => score + (planned.has(poi.id) ? order.length - index : 0),
    0,
  );
}

export function minimumStayMinutes(poi: MapPoi): number {
  const baseline = poi.venueType === "indoor" ? 20 : poi.venueType === "mixed" ? 18 : 15;
  return Math.min(poi.suggestedStayMinutes, baseline);
}

function emptyRoadMetrics(): RoadPathMetrics {
  return {
    walkingMinutes: 0,
    scenicScore: 0,
    shelterScore: 0,
    crowdCost: 0,
    energyCost: 0,
    nightSuitability: 0,
  };
}

function mergeSegments(segments: RoadPath[], firstPoi?: MapPoi): RoadPath {
  if (!segments.length) {
    return {
      coordinates: firstPoi ? [[firstPoi.lng, firstPoi.lat]] : [],
      metrics: emptyRoadMetrics(),
    };
  }
  const coordinates: [number, number][] = [];
  segments.forEach((segment) => {
    if (!coordinates.length) coordinates.push(...segment.coordinates);
    else coordinates.push(...segment.coordinates.slice(1));
  });
  const walkingMinutes = segments.reduce((sum, segment) => sum + segment.metrics.walkingMinutes, 0);
  const average = (key: keyof Omit<RoadPathMetrics, "walkingMinutes">) =>
    walkingMinutes
      ? Math.round(
          segments.reduce(
            (sum, segment) => sum + segment.metrics[key] * segment.metrics.walkingMinutes,
            0,
          ) / walkingMinutes,
        )
      : 0;
  return {
    coordinates,
    metrics: {
      walkingMinutes,
      scenicScore: average("scenicScore"),
      shelterScore: average("shelterScore"),
      crowdCost: average("crowdCost"),
      energyCost: average("energyCost"),
      nightSuitability: average("nightSuitability"),
    },
  };
}

function formatDuration(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `约 ${rounded}min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `约 ${hours}小时${rest}分` : `约 ${hours}小时`;
}

function clockLabel(minutes: number): string {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function cultureFocusEntityIds(options: RecommendationOptions): string[] {
  const fromTags = resolveCultureEntityIds(options.cultureFocusTags ?? []);
  const fromSemantic = options.semanticIntent?.matches.flatMap((match) => match.matchedKnowledgeEntityIds) ?? [];
  return [...new Set([...(options.cultureFocusEntityIds ?? []), ...fromTags, ...fromSemantic])].sort();
}

function rainyScore(order: MapPoi[]): number {
  if (!order.length) return 0;
  return Math.round(
    order.reduce((sum, poi) => sum + poi.rainyDaySuitability * 20, 0) / order.length,
  );
}

function semanticScore(order: MapPoi[], intent?: SemanticIntent | null): number {
  if (!intent || !order.length) return 0;
  const scores = new Map(intent.matches.map((match) => [match.poiId, match.score]));
  return Math.round(order.reduce((sum, poi) => sum + (scores.get(poi.id) ?? 0), 0) / order.length);
}

function sunnyScore(order: MapPoi[]): number {
  if (!order.length) return 0;
  return Math.round(
    order.reduce(
      (sum, poi) => sum + (poi.venueType === "outdoor" ? 100 : poi.venueType === "mixed" ? 60 : 20),
      0,
    ) / order.length,
  );
}

function scheduleCandidate(
  order: MapPoi[],
  legWalkingMinutes: number[],
  initialWalkingMinutes: number,
  options: RecommendationOptions,
): { stays: number[]; stops: ScheduledStop[]; total: number; wait: number } | null {
  const stays = order.map(minimumStayMinutes);
  const stops: ScheduledStop[] = [];
  let cursor = options.departureTimeMinutes + initialWalkingMinutes;
  let totalWait = 0;
  for (let index = 0; index < order.length; index++) {
    if (index > 0) cursor += legWalkingMinutes[index - 1] ?? 0;
    const poi = order[index];
    const waitMinutes = Math.max(0, poi.operatingHours.opensAtMinutes - cursor);
    const arrival = cursor + waitMinutes;
    const departure = arrival + stays[index];
    if (
      departure > poi.operatingHours.closesAtMinutes
    ) {
      return null;
    }
    totalWait += waitMinutes;
    stops.push({
      poiId: poi.id,
      arrivalMinutes: Math.round(arrival),
      departureMinutes: Math.round(departure),
      stayMinutes: stays[index],
      waitMinutes: Math.round(waitMinutes),
    });
    cursor = departure;
  }
  const total = Math.round(cursor - options.departureTimeMinutes);
  return total <= options.timeBudgetMinutes ? { stays, stops, total, wait: Math.round(totalWait) } : null;
}

function scoreCandidate(
  candidate: Candidate,
  mode: RouteMode,
  options: RecommendationOptions,
  totalSelected: number,
): number {
  const featureFlags = resolveFeatureFlags(options);
  const omittedPenalty = (totalSelected - candidate.order.length) * 1000;
  const cultureBenefit = featureFlags.cultureGraphScoring
    ? candidate.cultureCoverageScore * (options.preference === "culture" ? 0.15 : 0.05)
    : 0;
  const weatherBenefit = featureFlags.weatherAdaptation && options.weatherCondition === "rainy"
    ? candidate.rainyScore * 0.28 + candidate.path.metrics.shelterScore * 0.18
    : featureFlags.weatherAdaptation && options.weatherCondition === "sunny"
      ? candidate.sunnyScore * 0.24 + candidate.path.metrics.scenicScore * 0.08
      : 0;
  const crowdPenalty = options.avoidCrowds ? candidate.path.metrics.crowdCost * 0.3 : 0;
  const nightBenefit = options.nightMode ? candidate.path.metrics.nightSuitability * 0.22 : 0;
  const semanticBenefit = featureFlags.semanticPreference
    ? Math.min(15, candidate.semanticScore * 0.15)
    : 0;
  const shared = omittedPenalty - cultureBenefit + crowdPenalty - nightBenefit - semanticBenefit;
  if (mode === "short") {
    // “效率”仍以总时长和距离为主，但在恶劣天气下允许小幅绕行，
    // 避免把明显不适宜的露天点机械地判为最优。
    return shared + candidate.totalMinutes * 0.18 + candidate.km * 3 + candidate.reversals * 2
      - weatherBenefit * 0.6;
  }
  return shared + candidate.km - candidate.path.metrics.scenicScore * 0.25 - weatherBenefit
    - candidate.planned * 2 + candidate.reversals;
}

function toRoute(
  id: string,
  name: string,
  tagline: string,
  candidate: Candidate,
  allPoiIds: string[],
  options: RecommendationOptions,
): MapRoute {
  const { order, path, stayMinutes, scheduledStops, totalMinutes } = candidate;
  const focusEntityIds = cultureFocusEntityIds(options);
  const stayTotal = stayMinutes.reduce((sum, value) => sum + value, 0);
  const indoorMinutes = order.reduce((sum, poi, index) => {
    const stay = stayMinutes[index];
    if (poi.venueType === "indoor") return sum + stay;
    if (poi.venueType === "mixed") return sum + stay * 0.5;
    return sum;
  }, 0);
  const walkingMinutes = candidate.walkingMinutes;
  const poiEnergy = order.reduce((sum, poi) => sum + poi.energyLevel * 20, 0) / order.length;
  const metrics: RouteMetrics = {
    distanceKm: candidate.km,
    walkingMinutes,
    stayMinutes: stayTotal,
    waitMinutes: candidate.waitMinutes,
    scenicScore: path.metrics.scenicScore,
    shelterScore: path.metrics.shelterScore,
    crowdCost: path.metrics.crowdCost,
    energyCost: Math.min(
      100,
      Math.round((path.metrics.energyCost * 0.7 + poiEnergy * 0.3) * options.walkingFactor),
    ),
    nightSuitability: path.metrics.nightSuitability,
    indoorStayShare: stayTotal ? Math.round((indoorMinutes / stayTotal) * 100) : 0,
    restFacilityCount: order.filter((poi) => poi.restFacilities.length > 0).length,
    cultureTags: [...new Set(order.flatMap((poi) => poi.cultureTags))],
    cultureCoverageScore: candidate.cultureCoverage.score,
    coveredCultureThemeIds: candidate.cultureCoverage.coveredThemeIds,
    uncoveredCultureThemeIds: candidate.cultureCoverage.uncoveredThemeIds,
    coveredCulturePeriodIds: candidate.cultureCoverage.coveredPeriodIds,
    semanticMatchScore: candidate.semanticScore,
  };
  const narrative = buildRouteNarrative(order.map((poi) => poi.id), focusEntityIds);
  return {
    id,
    name,
    tagline,
    poiIds: order.map((poi) => poi.id),
    duration: formatDuration(totalMinutes),
    distance: `约 ${candidate.km.toFixed(1)} km`,
    coordinates: path.coordinates,
    metrics,
    scheduledStops,
    omittedPoiIds: allPoiIds.filter((poiId) => !order.some((poi) => poi.id === poiId)),
    completionTime: clockLabel(options.departureTimeMinutes + totalMinutes),
    dataUpdatedAt: options.dataUpdatedAt,
    dataStatus: options.dataStatus,
    narrative,
    cultureOldestReviewedAt: narrative.oldestReviewedAt,
    routingData: {
      provider: WALKING_MATRIX.provider,
      providerVersion: WALKING_MATRIX.providerVersion,
      costing: WALKING_MATRIX.costing,
      sourceDataset: WALKING_MATRIX.sourceDataset,
      generatedAt: WALKING_MATRIX.generatedAt,
      attribution: WALKING_MATRIX.attribution,
      originFallbackUsed: Boolean(options.originCoordinates),
    },
  };
}

function comparePercent(value: number, baseline: number): number {
  return baseline > 0 ? Math.round(((baseline - value) / baseline) * 100) : 0;
}

function explainRoute(
  route: MapRoute,
  alternative: MapRoute,
  role: "shortest" | "scenic",
  options: RecommendationOptions,
): RouteExplanation[] {
  const metrics = route.metrics!;
  const other = alternative.metrics!;
  const explanations: RouteExplanation[] = [];
  const distanceDiff = Math.abs(metrics.distanceKm - other.distanceKm);

  explanations.push(role === "shortest"
    ? {
        id: "distance",
        tone: "efficiency",
        text: distanceDiff >= 0.05
          ? `比体验路线少走 ${distanceDiff.toFixed(1)} 公里`
          : `步行段约 ${metrics.distanceKm.toFixed(1)} 公里，优先减少绕行`,
      }
    : {
        id: "scenery",
        tone: "scenery",
        text: `沿路景观评分 ${metrics.scenicScore}/100，优先湖岸、城墙与林荫路段`,
      });

  if (options.weatherCondition === "rainy") {
    explanations.push({
      id: "weather",
      tone: "comfort",
      text: `雨天室内或半室内停留占比 ${metrics.indoorStayShare}%，道路遮蔽评分 ${metrics.shelterScore}/100`,
    });
  }
  if (options.preference === "culture") {
    const focusLabels = cultureFocusEntityIds(options)
      .map((id) => getKnowledgeEntity(id)?.label)
      .filter((label): label is string => Boolean(label));
    const coveredLabels = metrics.coveredCultureThemeIds
      .map((id) => getKnowledgeEntity(id)?.label)
      .filter((label): label is string => Boolean(label));
    explanations.push({
      id: "culture",
      tone: "culture",
      text: `文化主题覆盖率 ${metrics.cultureCoverageScore}%${focusLabels.length ? `，重点响应${focusLabels.slice(0, 3).join("、")}` : `，已覆盖${coveredLabels.slice(0, 3).join("、")}`}`,
    });
  }
  if (options.semanticIntent) {
    const routePoiIds = new Set(route.poiIds ?? []);
    const routeMatches = options.semanticIntent.matches
      .filter((match) => routePoiIds.has(match.poiId))
      .sort((a, b) => b.score - a.score);
    const highlighted = routeMatches
      .slice(0, 2)
      .map((match) => getPoiById(match.poiId)?.name)
      .filter(Boolean)
      .join("、");
    const matchedEntities = [...new Set(routeMatches.flatMap((match) => match.matchedKnowledgeEntityIds))]
      .map((id) => getKnowledgeEntity(id)?.label)
      .filter((label): label is string => Boolean(label));
    const matchedTags = [...new Set(routeMatches.flatMap((match) => match.matchedTags))];
    const matchedLabels = [...new Set([...matchedEntities, ...matchedTags])].slice(0, 3);
    explanations.push({
      id: "semantic",
      tone: "culture",
      text: `与“${options.semanticIntent.query.slice(0, 28)}”相对匹配 ${metrics.semanticMatchScore ?? 0}/100${highlighted ? `，${highlighted}获得偏好加分` : ""}${matchedLabels.length ? `；图谱命中${matchedLabels.join("、")}` : ""}`,
    });
  }
  if (options.avoidCrowds) {
    const reduction = comparePercent(metrics.crowdCost, other.crowdCost);
    explanations.push({
      id: "crowd",
      tone: "comfort",
      text: reduction > 0
        ? `项目样本拥挤成本比备选路线低 ${reduction}%`
        : `项目样本拥挤成本 ${metrics.crowdCost}/100`,
    });
  }
  if (options.nightMode) {
    explanations.push({
      id: "night",
      tone: "comfort",
      text: `夜间适宜性 ${metrics.nightSuitability}/100，已排除当前时段闭馆地点`,
    });
  }

  const omitted = (route.omittedPoiIds ?? []).map((id) => getPoiById(id)).filter(Boolean) as MapPoi[];
  if (omitted.length) {
    const closed = new Set(options.closedPoiIds ?? []);
    const temporarilyClosed = omitted.filter((poi) => closed.has(poi.id));
    const closingNames = omitted
      .filter((poi) =>
        !closed.has(poi.id) &&
        poi.operatingHours.closesAtMinutes <= options.departureTimeMinutes + options.timeBudgetMinutes
      )
      .map((poi) => `${poi.name}（${poi.operatingHours.label}）`);
    const budgetNames = omitted.filter(
      (poi) => !closed.has(poi.id) && !closingNames.some((name) => name.startsWith(`${poi.name}（`)),
    );
    const parts = [
      temporarilyClosed.length
        ? `${temporarilyClosed.map((poi) => poi.name).join("、")}为临时关闭状态`
        : "",
      closingNames.length
        ? `${closingNames.join("、")}无法在闭馆前完成`
        : "",
      budgetNames.length
        ? `为满足预算暂缓${budgetNames.map((poi) => poi.name).join("、")}`
        : "",
    ].filter(Boolean);
    explanations.push({
      id: "omitted",
      tone: "caution",
      text: `未安排：${parts.join("；")}`,
    });
  }
  explanations.push({
    id: "time",
    tone: "efficiency",
    text: `步行 ${metrics.walkingMinutes} 分钟 + 游览 ${metrics.stayMinutes} 分钟${metrics.waitMinutes ? ` + 等候 ${metrics.waitMinutes} 分钟` : ""}，预计 ${route.completionTime} 完成`,
  });
  explanations.push({
    id: "rest",
    tone: "comfort",
    text: `途经 ${metrics.restFacilityCount} 处设有休息设施的地点`,
  });
  return explanations.slice(0, 6);
}

export function recommendTwoRoutes(
  poiIds: string[],
  plannedIds: string[] = [],
  options: RecommendationOptions,
): { scenic: MapRoute; shortest: MapRoute } | null {
  const unique = [...new Set(poiIds)].filter(Boolean).slice(0, 5);
  if (!unique.length) return null;
  const closed = new Set(options.closedPoiIds ?? []);
  const pois = unique
    .map((id) => getPoiById(id))
    .filter((poi): poi is MapPoi => Boolean(poi) && !closed.has(poi!.id));
  if (!pois.length) return null;

  const requestedStart = options.startId
    ? pois.find((poi) => poi.id === options.startId)
    : undefined;
  const orders = requestedStart
    ? [
        [requestedStart],
        ...orderedSelections(pois.filter((poi) => poi.id !== requestedStart.id)).map((order) => [requestedStart, ...order]),
      ]
    : orderedSelections(pois);
  const planned = new Set(plannedIds);
  const focusEntityIds = cultureFocusEntityIds(options);
  const pairCache = new Map<string, RoadPath>();
  const getPair = (from: MapPoi, to: MapPoi, mode: RouteMode) => {
    const cacheKey = `${mode}:${from.id}>${to.id}`;
    const cached = pairCache.get(cacheKey);
    if (cached) return cached;
    const path = alongRoadPath([from.id, to.id], mode);
    pairCache.set(cacheKey, path);
    return path;
  };

  const getOriginSegment = (firstPoi: MapPoi): RoadPath | null => {
    const origin = options.originCoordinates;
    if (!origin) return null;
    const coordinates: [number, number][] = [
      [origin.lng, origin.lat],
      [firstPoi.lng, firstPoi.lat],
    ];
    const walkingMinutes = Math.max(1, Math.round(coordsDistanceKm(coordinates) * 15));
    return {
      coordinates,
      metrics: {
        walkingMinutes,
        scenicScore: 40,
        shelterScore: 35,
        crowdCost: 50,
        energyCost: 50,
        nightSuitability: 62,
      },
    };
  };

  function evaluate(mode: RouteMode): Candidate[] {
    return orders.flatMap((order) => {
      const routeSegments = order.slice(1).map((poi, index) => getPair(order[index], poi, mode));
      const originSegment = getOriginSegment(order[0]);
      const path = mergeSegments(originSegment ? [originSegment, ...routeSegments] : routeSegments, order[0]);
      const matrixLegs = order.slice(1).map((poi, index) => {
        const leg = getWalkingMatrixLeg(order[index].id, poi.id);
        if (!leg) throw new Error(`Missing walking matrix leg ${order[index].id}>${poi.id}`);
        return leg;
      });
      const legWalkingMinutes = matrixLegs.map((leg) =>
        Math.max(1, Math.ceil(leg.durationSeconds * options.walkingFactor / 60)),
      );
      const initialWalkingMinutes = originSegment
        ? Math.round(originSegment.metrics.walkingMinutes * options.walkingFactor)
        : 0;
      const schedule = scheduleCandidate(order, legWalkingMinutes, initialWalkingMinutes, options);
      if (!schedule) return [];
      const cultureCoverage = calculateCultureCoverage(
        order.map((poi) => poi.id),
        pois.map((poi) => poi.id),
        focusEntityIds,
      );
      return [{
        order,
        path,
        km: matrixLegs.reduce((sum, leg) => sum + leg.distanceKm, 0)
          + (originSegment ? coordsDistanceKm(originSegment.coordinates) : 0),
        reversals: headingReversals(path.coordinates),
        planned: plannedFrontScore(order, planned),
        stayMinutes: schedule.stays,
        scheduledStops: schedule.stops,
        totalMinutes: schedule.total,
        walkingMinutes: initialWalkingMinutes + legWalkingMinutes.reduce((sum, value) => sum + value, 0),
        waitMinutes: schedule.wait,
        rainyScore: rainyScore(order),
        sunnyScore: sunnyScore(order),
        cultureCoverageScore: cultureCoverage.score,
        cultureCoverage,
        semanticScore: semanticScore(order, options.semanticIntent),
      }];
    });
  }

  const shortCandidates = evaluate("short").sort(
    (a, b) => scoreCandidate(a, "short", options, pois.length) - scoreCandidate(b, "short", options, pois.length),
  );
  const scenicCandidates = evaluate("scenic").sort(
    (a, b) => scoreCandidate(a, "scenic", options, pois.length) - scoreCandidate(b, "scenic", options, pois.length),
  );
  const shortest = shortCandidates[0];
  if (!shortest) return null;
  const scenicTop = scenicCandidates[0] ?? shortest;
  const scenic = scenicCandidates.find(
    (candidate) =>
      candidate.order.length === scenicTop.order.length &&
      keyOf(candidate.order) !== keyOf(shortest.order),
  ) ?? scenicTop;

  const optimizerPoiIds = pois.map((poi) => poi.id);
  const poiTravelMatrix = walkingTimeMatrixMinutes(optimizerPoiIds, options.walkingFactor);
  const useVirtualStart = !requestedStart;
  const virtualStartIndex = pois.length;
  const originWalkingMinutes = pois.map((poi) => {
    if (!options.originCoordinates) return 0;
    return Math.max(1, Math.round(coordsDistanceKm([
      [options.originCoordinates.lng, options.originCoordinates.lat],
      [poi.lng, poi.lat],
    ]) * 15 * options.walkingFactor));
  });
  const travelTimeMatrix = useVirtualStart
    ? [
        ...poiTravelMatrix.map((row) => [...row, 0]),
        [...originWalkingMinutes, 0],
      ]
    : poiTravelMatrix;
  const optimizationProblem: ExactOptimizationProblem = {
    travelTimeMatrix,
    visitDurations: [
      ...pois.map(minimumStayMinutes),
      ...(useVirtualStart ? [0] : []),
    ],
    timeWindows: [
      ...pois.map((poi) => ({
        openMinutes: poi.operatingHours.opensAtMinutes,
        closeMinutes: poi.operatingHours.closesAtMinutes,
      })),
      ...(useVirtualStart ? [{
        openMinutes: options.departureTimeMinutes,
        closeMinutes: options.departureTimeMinutes,
      }] : []),
    ],
    departureTimeMinutes: options.departureTimeMinutes,
    timeBudgetMinutes: options.timeBudgetMinutes,
    startIndex: useVirtualStart ? virtualStartIndex : pois.indexOf(requestedStart),
  };
  const baselineSolution = solveBaselineOrder(optimizationProblem);
  const optimalSolution = solveExactTimeWindowRoute(optimizationProblem);
  const intelligentCandidate = options.preference === "efficiency" ? shortest : scenic;

  const solutionDistance = (solution: ExactOptimizationSolution): number =>
    solution.order.slice(1).reduce((sum, toIndex, position) => {
      const fromIndex = solution.order[position];
      if (useVirtualStart && fromIndex === virtualStartIndex) {
        if (!options.originCoordinates) return sum;
        const poi = pois[toIndex];
        return sum + coordsDistanceKm([
          [options.originCoordinates.lng, options.originCoordinates.lat],
          [poi.lng, poi.lat],
        ]);
      }
      const leg = getWalkingMatrixLeg(pois[fromIndex].id, pois[toIndex].id);
      return sum + (leg?.distanceKm ?? 0);
    }, 0);
  const solutionPoiIds = (solution: ExactOptimizationSolution): string[] =>
    solution.order
      .filter((index) => index !== virtualStartIndex)
      .map((index) => pois[index]?.id)
      .filter((id): id is string => Boolean(id));
  const summarizeSolution = (
    kind: "baseline" | "optimal",
    solution: ExactOptimizationSolution,
  ): AlgorithmRouteSummary => ({
    kind,
    label: kind === "baseline" ? "基准路线" : "最优验证路线",
    poiIds: solutionPoiIds(solution),
    distanceKm: solutionDistance(solution),
    walkingMinutes: Math.round(solution.walkingMinutes),
    stayMinutes: Math.round(solution.stayMinutes),
    waitMinutes: Math.round(solution.waitMinutes),
    totalMinutes: Math.round(solution.totalMinutes),
    feasible: solution.status === "optimal",
    engine: kind === "baseline" ? "用户顺序 + 时间窗截断" : "精确枚举（≤5 POI）",
    note: kind === "baseline"
      ? "按用户勾选顺序游览，遇到闭馆或超时后截断。"
      : `穷举 ${solution.exploredOrders} 个可选顺序，以先覆盖更多地点、再缩短总时间为目标。`,
  });
  const intelligentSummary: AlgorithmRouteSummary = {
    kind: "intelligent",
    label: "智能路线",
    poiIds: intelligentCandidate.order.map((poi) => poi.id),
    distanceKm: intelligentCandidate.km,
    walkingMinutes: intelligentCandidate.walkingMinutes,
    stayMinutes: intelligentCandidate.stayMinutes.reduce((sum, value) => sum + value, 0),
    waitMinutes: intelligentCandidate.waitMinutes,
    totalMinutes: intelligentCandidate.totalMinutes,
    feasible: true,
    engine: "多目标规划 + Valhalla 步行矩阵",
    note: "在时间窗和预算硬约束内，综合天气、体力、文化、语义与体验偏好评分。",
  };
  const baselineSummary = summarizeSolution("baseline", baselineSolution);
  const optimalSummary = summarizeSolution("optimal", optimalSolution);
  const sameCoverage = intelligentSummary.poiIds.length === optimalSummary.poiIds.length;
  const comparison: RouteAlgorithmComparison = {
    baseline: baselineSummary,
    intelligent: intelligentSummary,
    optimal: optimalSummary,
    optimalityGapPercent: sameCoverage && optimalSummary.totalMinutes > 0
      ? Math.max(0, Math.round(
          ((intelligentSummary.totalMinutes - optimalSummary.totalMinutes) / optimalSummary.totalMinutes) * 100,
        ))
      : null,
    visitedGap: optimalSummary.poiIds.length - intelligentSummary.poiIds.length,
    exactValidation: true,
    exploredOrders: optimalSolution.exploredOrders,
    objective: "先最大化预算内可完成地点数，再最小化总用时与步行时间",
  };

  const shortestRoute = toRoute(
    "recommend-shortest",
    "效率优先",
    `硬预算内减少绕行：${shortest.order.map((poi) => poi.name).join(" → ")}`,
    shortest,
    unique,
    options,
  );
  const scenicRoute = toRoute(
    "recommend-scenic",
    options.nightMode ? "舒适夜游" : "体验优先",
    `${options.weatherCondition === "rainy" ? "优先室内与有遮蔽路段" : "优先景观与文化体验"}：${scenic.order.map((poi) => poi.name).join(" → ")}`,
    scenic,
    unique,
    options,
  );

  return {
    shortest: {
      ...shortestRoute,
      explanations: explainRoute(shortestRoute, scenicRoute, "shortest", options),
      algorithmComparison: comparison,
    },
    scenic: {
      ...scenicRoute,
      explanations: explainRoute(scenicRoute, shortestRoute, "scenic", options),
      algorithmComparison: comparison,
    },
  };
}
