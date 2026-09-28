import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { calculateCultureCoverage, resolveCultureEntityIds, CULTURE_GRAPH } from "../src/lib/culture/graph";
import {
  EXPERIMENT_CONFIGS,
  describe,
  describePairedDifferences,
  improvementPercent,
  type ExperimentConfigId,
  type RouteExperimentScenario,
} from "../src/lib/experiments/route-experiment";
import { walkingTimeFactor } from "../src/lib/map/planning";
import { getPoiById } from "../src/lib/map/pois";
import {
  minimumStayMinutes,
  recommendTwoRoutes,
  type RecommendationOptions,
} from "../src/lib/map/recommend";
import type { AlgorithmRouteSummary, MapRoute } from "../src/lib/map/types";
import { solveExactTimeWindowRoute, type ExactOptimizationProblem } from "../src/lib/optimization/exact-solver";
import { WALKING_MATRIX, walkingTimeMatrixMinutes } from "../src/lib/routing/walking-matrix";
import type { SemanticIntent } from "../src/lib/semantic/types";

const ROOT = path.resolve(".");
const OUTPUT_DIR = path.join(ROOT, "experiments", "route-planning");
const CONFIG_IDS = Object.keys(EXPERIMENT_CONFIGS) as ExperimentConfigId[];
const DATA_STATUS = "离线路网快照与项目样本数据；不代表实时城市状态";

interface SemanticFixturesDocument {
  generatedAt: string;
  model: { id: string; revision: string; poiEmbeddingSourceHash: string };
  coldLoadMs: number;
  warmInferenceMs: number[];
  fixtures: Record<string, SemanticIntent>;
}

interface ValidationResult {
  independentlyFeasible: boolean;
  overBudgetViolation: boolean;
  routeClosingViolation: boolean;
  stopClosingViolationCount: number;
  closedPoiViolationCount: number;
}

interface ExperimentRow {
  scenarioId: string;
  ordinal: number;
  templateId: string;
  profileId: string;
  config: ExperimentConfigId;
  expectedFeasible: boolean;
  oracleFeasible: boolean;
  generated: boolean;
  independentlyFeasible: boolean;
  correctRejection: boolean;
  overBudgetViolation: boolean;
  routeClosingViolation: boolean;
  stopClosingViolationCount: number;
  closedPoiViolationCount: number;
  completedPoiCount: number | null;
  distanceKm: number | null;
  walkingMinutes: number | null;
  stayMinutes: number | null;
  waitMinutes: number | null;
  totalMinutes: number | null;
  cultureCoveragePercent: number | null;
  focusedThemeCount: number | null;
  indoorStaySharePercent: number | null;
  shelterScore: number | null;
  scenicScore: number | null;
  semanticMatchScore: number | null;
  calculationMs: number;
  baselineFeasible: boolean | null;
  baselineCompletedPoiCount: number | null;
  baselineDistanceKm: number | null;
  baselineTotalMinutes: number | null;
  baselineCultureCoveragePercent: number | null;
  optimalFeasible: boolean | null;
  optimalCompletedPoiCount: number | null;
  optimalDistanceKm: number | null;
  optimalTotalMinutes: number | null;
  optimalVisitedGap: number | null;
  optimalTimeGapMinutes: number | null;
  routePoiIds: string;
  baselinePoiIds: string;
  optimalPoiIds: string;
}

interface PerformanceRow {
  sample: number;
  scenarioId: string;
  repeat: number;
  milliseconds: number;
}

function focusEntityIds(intent: SemanticIntent): string[] {
  return [...new Set([
    ...(intent.inferredPatch.cultureFocusEntityIds ?? []),
    ...resolveCultureEntityIds(intent.inferredPatch.cultureFocusTags ?? []),
    ...intent.matches.flatMap((match) => match.matchedKnowledgeEntityIds),
  ])].sort();
}

function routeSemanticScore(poiIds: string[], intent: SemanticIntent): number {
  if (!poiIds.length) return 0;
  const scoreByPoi = new Map(intent.matches.map((match) => [match.poiId, match.score]));
  return Number((poiIds.reduce((sum, poiId) => sum + (scoreByPoi.get(poiId) ?? 0), 0) / poiIds.length).toFixed(4));
}

function routeIndoorShare(poiIds: string[]): number {
  const pois = poiIds.map((poiId) => getPoiById(poiId)).filter((poi) => Boolean(poi));
  const total = pois.reduce((sum, poi) => sum + minimumStayMinutes(poi!), 0);
  const indoor = pois.reduce((sum, poi) => {
    const stay = minimumStayMinutes(poi!);
    return sum + (poi!.venueType === "indoor" ? stay : poi!.venueType === "mixed" ? stay * 0.5 : 0);
  }, 0);
  return total ? Number(((indoor / total) * 100).toFixed(4)) : 0;
}

function optionsFor(
  scenario: RouteExperimentScenario,
  intent: SemanticIntent,
  config: ExperimentConfigId,
): RecommendationOptions {
  return {
    startId: scenario.startPoiId,
    preference: scenario.preference,
    timeBudgetMinutes: scenario.budgetMinutes,
    walkingFactor: walkingTimeFactor(scenario.walkingAbility),
    weatherCondition: scenario.weatherCondition,
    departureTimeMinutes: scenario.departureTimeMinutes,
    closedPoiIds: scenario.closedPoiIds,
    avoidCrowds: scenario.avoidCrowds,
    nightMode: scenario.nightMode,
    cultureFocusTags: intent.inferredPatch.cultureFocusTags ?? [],
    cultureFocusEntityIds: intent.inferredPatch.cultureFocusEntityIds ?? [],
    dataUpdatedAt: WALKING_MATRIX.generatedAt,
    dataStatus: DATA_STATUS,
    semanticIntent: intent,
    featureFlags: EXPERIMENT_CONFIGS[config],
  };
}

function oracleFeasible(scenario: RouteExperimentScenario): boolean {
  const closed = new Set(scenario.closedPoiIds);
  const pois = scenario.candidatePoiIds
    .map((poiId) => getPoiById(poiId))
    .filter((poi) => Boolean(poi) && !closed.has(poi!.id));
  if (!pois.length) return false;
  const requestedStart = scenario.startPoiId
    ? pois.find((poi) => poi!.id === scenario.startPoiId)
    : undefined;
  const useVirtualStart = !requestedStart;
  const matrix = walkingTimeMatrixMinutes(pois.map((poi) => poi!.id), walkingTimeFactor(scenario.walkingAbility));
  const startIndex = useVirtualStart ? pois.length : pois.indexOf(requestedStart!);
  const problem: ExactOptimizationProblem = {
    travelTimeMatrix: useVirtualStart
      ? [...matrix.map((row) => [...row, 0]), [...pois.map(() => 0), 0]]
      : matrix,
    visitDurations: [...pois.map((poi) => minimumStayMinutes(poi!)), ...(useVirtualStart ? [0] : [])],
    timeWindows: [
      ...pois.map((poi) => ({
        openMinutes: poi!.operatingHours.opensAtMinutes,
        closeMinutes: poi!.operatingHours.closesAtMinutes,
      })),
      ...(useVirtualStart ? [{
        openMinutes: scenario.departureTimeMinutes,
        closeMinutes: scenario.departureTimeMinutes,
      }] : []),
    ],
    departureTimeMinutes: scenario.departureTimeMinutes,
    timeBudgetMinutes: scenario.budgetMinutes,
    startIndex,
  };
  const solution = solveExactTimeWindowRoute(problem);
  const visitedPoiCount = solution.order.filter((index) => index !== (useVirtualStart ? pois.length : -1)).length;
  return solution.status === "optimal" && visitedPoiCount > 0;
}

function validateRoute(route: MapRoute | null, scenario: RouteExperimentScenario): ValidationResult {
  if (!route?.metrics) {
    return {
      independentlyFeasible: false,
      overBudgetViolation: false,
      routeClosingViolation: false,
      stopClosingViolationCount: 0,
      closedPoiViolationCount: 0,
    };
  }
  const totalMinutes = route.metrics.walkingMinutes + route.metrics.stayMinutes + route.metrics.waitMinutes;
  const stopClosingViolationCount = (route.scheduledStops ?? []).filter((stop) => {
    const poi = getPoiById(stop.poiId);
    return !poi || stop.departureMinutes > poi.operatingHours.closesAtMinutes;
  }).length;
  const closed = new Set(scenario.closedPoiIds);
  const closedPoiViolationCount = (route.poiIds ?? []).filter((poiId) => closed.has(poiId)).length;
  const overBudgetViolation = totalMinutes > scenario.budgetMinutes + 1e-9;
  const routeClosingViolation = stopClosingViolationCount > 0;
  return {
    independentlyFeasible: !overBudgetViolation && !routeClosingViolation && closedPoiViolationCount === 0,
    overBudgetViolation,
    routeClosingViolation,
    stopClosingViolationCount,
    closedPoiViolationCount,
  };
}

function selectedIntelligentRoute(
  result: ReturnType<typeof recommendTwoRoutes>,
  scenario: RouteExperimentScenario,
): MapRoute | null {
  if (!result) return null;
  return scenario.preference === "efficiency" ? result.shortest : result.scenic;
}

function solutionCultureCoverage(
  summary: AlgorithmRouteSummary,
  scenario: RouteExperimentScenario,
  intent: SemanticIntent,
): number {
  const activePoiIds = scenario.candidatePoiIds.filter((poiId) => !scenario.closedPoiIds.includes(poiId));
  return calculateCultureCoverage(summary.poiIds, activePoiIds, focusEntityIds(intent)).score;
}

function runFunctionalScenario(
  scenario: RouteExperimentScenario,
  intent: SemanticIntent,
  config: ExperimentConfigId,
  oracle: boolean,
): ExperimentRow {
  const started = performance.now();
  const result = recommendTwoRoutes(scenario.candidatePoiIds, [], optionsFor(scenario, intent, config));
  const calculationMs = performance.now() - started;
  const route = selectedIntelligentRoute(result, scenario);
  const validation = validateRoute(route, scenario);
  const comparison = route?.algorithmComparison;
  const activePoiIds = scenario.candidatePoiIds.filter((poiId) => !scenario.closedPoiIds.includes(poiId));
  const routePoiIds = route?.poiIds ?? [];
  const coverage = route
    ? calculateCultureCoverage(routePoiIds, activePoiIds, focusEntityIds(intent))
    : null;
  const baseline = comparison?.baseline;
  const optimal = comparison?.optimal;
  const generated = Boolean(route);
  return {
    scenarioId: scenario.id,
    ordinal: scenario.ordinal,
    templateId: scenario.templateId,
    profileId: scenario.profileId,
    config,
    expectedFeasible: scenario.expectedFeasible,
    oracleFeasible: oracle,
    generated,
    independentlyFeasible: validation.independentlyFeasible,
    correctRejection: !oracle && !generated,
    overBudgetViolation: validation.overBudgetViolation,
    routeClosingViolation: validation.routeClosingViolation,
    stopClosingViolationCount: validation.stopClosingViolationCount,
    closedPoiViolationCount: validation.closedPoiViolationCount,
    completedPoiCount: routePoiIds.length || null,
    distanceKm: route?.metrics?.distanceKm ?? null,
    walkingMinutes: route?.metrics?.walkingMinutes ?? null,
    stayMinutes: route?.metrics?.stayMinutes ?? null,
    waitMinutes: route?.metrics?.waitMinutes ?? null,
    totalMinutes: route?.metrics
      ? route.metrics.walkingMinutes + route.metrics.stayMinutes + route.metrics.waitMinutes
      : null,
    cultureCoveragePercent: coverage?.score ?? null,
    focusedThemeCount: coverage
      ? coverage.coveredThemeIds.filter((id) => focusEntityIds(intent).includes(id)).length
      : null,
    indoorStaySharePercent: route ? routeIndoorShare(routePoiIds) : null,
    shelterScore: route?.metrics?.shelterScore ?? null,
    scenicScore: route?.metrics?.scenicScore ?? null,
    semanticMatchScore: route ? routeSemanticScore(routePoiIds, intent) : null,
    calculationMs: Number(calculationMs.toFixed(4)),
    baselineFeasible: baseline?.feasible ?? null,
    baselineCompletedPoiCount: baseline?.poiIds.length ?? null,
    baselineDistanceKm: baseline?.distanceKm ?? null,
    baselineTotalMinutes: baseline?.totalMinutes ?? null,
    baselineCultureCoveragePercent: baseline ? solutionCultureCoverage(baseline, scenario, intent) : null,
    optimalFeasible: optimal?.feasible ?? null,
    optimalCompletedPoiCount: optimal?.poiIds.length ?? null,
    optimalDistanceKm: optimal?.distanceKm ?? null,
    optimalTotalMinutes: optimal?.totalMinutes ?? null,
    optimalVisitedGap: comparison?.visitedGap ?? null,
    optimalTimeGapMinutes: optimal && route?.metrics && optimal.poiIds.length === routePoiIds.length
      ? Number((route.metrics.walkingMinutes + route.metrics.stayMinutes + route.metrics.waitMinutes - optimal.totalMinutes).toFixed(4))
      : null,
    routePoiIds: routePoiIds.join(">"),
    baselinePoiIds: baseline?.poiIds.join(">") ?? "",
    optimalPoiIds: optimal?.poiIds.join(">") ?? "",
  };
}

function finiteValues(rows: ExperimentRow[], key: keyof ExperimentRow): number[] {
  return rows.map((row) => row[key]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function rate(numerator: number, denominator: number): number | null {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(4)) : null;
}

function summarizeConfig(rows: ExperimentRow[]) {
  const oracleFeasibleRows = rows.filter((row) => row.oracleFeasible);
  const oracleInfeasibleRows = rows.filter((row) => !row.oracleFeasible);
  const generatedRows = rows.filter((row) => row.generated);
  return {
    scenarioCount: rows.length,
    oracleFeasibleCount: oracleFeasibleRows.length,
    oracleInfeasibleCount: oracleInfeasibleRows.length,
    generatedCount: generatedRows.length,
    feasibleGenerationRatePercent: rate(
      oracleFeasibleRows.filter((row) => row.generated && row.independentlyFeasible).length,
      oracleFeasibleRows.length,
    ),
    correctRejectionRatePercent: rate(oracleInfeasibleRows.filter((row) => row.correctRejection).length, oracleInfeasibleRows.length),
    overBudgetViolationRatePercent: rate(generatedRows.filter((row) => row.overBudgetViolation).length, generatedRows.length),
    routeClosingViolationRatePercent: rate(generatedRows.filter((row) => row.routeClosingViolation).length, generatedRows.length),
    stopClosingViolationRatePercent: rate(
      generatedRows.reduce((sum, row) => sum + row.stopClosingViolationCount, 0),
      generatedRows.reduce((sum, row) => sum + (row.completedPoiCount ?? 0), 0),
    ),
    closedPoiViolationRatePercent: rate(
      generatedRows.reduce((sum, row) => sum + row.closedPoiViolationCount, 0),
      generatedRows.reduce((sum, row) => sum + (row.completedPoiCount ?? 0), 0),
    ),
    metrics: Object.fromEntries([
      "completedPoiCount", "distanceKm", "walkingMinutes", "stayMinutes", "waitMinutes",
      "totalMinutes", "cultureCoveragePercent", "indoorStaySharePercent", "shelterScore",
      "scenicScore", "semanticMatchScore", "calculationMs",
    ].map((key) => [key, describe(finiteValues(generatedRows, key as keyof ExperimentRow))])),
  };
}

function pairedDifferences(
  fullRows: ExperimentRow[],
  comparisonRows: ExperimentRow[],
  key: keyof ExperimentRow,
): number[] {
  const comparisonById = new Map(comparisonRows.map((row) => [row.scenarioId, row]));
  return fullRows.flatMap((full) => {
    const comparison = comparisonById.get(full.scenarioId);
    const fullValue = full[key];
    const comparisonValue = comparison?.[key];
    return typeof fullValue === "number" && typeof comparisonValue === "number"
      ? [Number((fullValue - comparisonValue).toFixed(6))]
      : [];
  });
}

function baselineComparison(fullRows: ExperimentRow[]) {
  const generated = fullRows.filter((row) => row.generated && row.baselineFeasible);
  const equalCoverage = generated.filter((row) => row.completedPoiCount === row.baselineCompletedPoiCount);
  return {
    completionCountDifference: describePairedDifferences(generated.map(
      (row) => (row.completedPoiCount ?? 0) - (row.baselineCompletedPoiCount ?? 0),
    )),
    equalCompletedPoiScenarioCount: equalCoverage.length,
    distanceImprovementPercent: describePairedDifferences(equalCoverage.flatMap((row) => {
      const value = improvementPercent(row.baselineDistanceKm ?? Number.NaN, row.distanceKm ?? Number.NaN);
      return value == null ? [] : [value];
    })),
    totalTimeImprovementPercent: describePairedDifferences(equalCoverage.flatMap((row) => {
      const value = improvementPercent(row.baselineTotalMinutes ?? Number.NaN, row.totalMinutes ?? Number.NaN);
      return value == null ? [] : [value];
    })),
    cultureCoveragePercentagePointDifference: describePairedDifferences(generated.flatMap((row) =>
      row.cultureCoveragePercent == null || row.baselineCultureCoveragePercent == null
        ? []
        : [row.cultureCoveragePercent - row.baselineCultureCoveragePercent],
    )),
    cultureCoverageRelativeImprovementPercent: describePairedDifferences(generated.flatMap((row) => {
      const value = improvementPercent(row.baselineCultureCoveragePercent ?? Number.NaN, row.cultureCoveragePercent ?? Number.NaN);
      return value == null ? [] : [-value];
    })),
  };
}

function optimalComparison(fullRows: ExperimentRow[]) {
  const generated = fullRows.filter((row) => row.generated && row.optimalFeasible);
  return {
    visitedGap: describe(finiteValues(generated, "optimalVisitedGap")),
    totalTimeGapMinutesForEqualCoverage: describe(finiteValues(generated, "optimalTimeGapMinutes")),
    exactMatchCount: generated.filter((row) => row.optimalVisitedGap === 0 && row.optimalTimeGapMinutes === 0).length,
  };
}

function ablationSummary(rows: ExperimentRow[]) {
  const byConfig = new Map(CONFIG_IDS.map((config) => [config, rows.filter((row) => row.config === config)]));
  const full = byConfig.get("full")!;
  const noBge = byConfig.get("noBge")!;
  const noKg = byConfig.get("noKg")!;
  const noWeather = byConfig.get("noWeather")!;
  const rainyFull = full.filter((row) => row.profileId === "rain-short");
  const rainyNoWeather = noWeather.filter((row) => row.profileId === "rain-short");
  const sunnyFull = full.filter((row) => row.profileId === "culture-day");
  const sunnyNoWeather = noWeather.filter((row) => row.profileId === "culture-day");
  return {
    noBge: {
      semanticMatchScoreDifference: describePairedDifferences(pairedDifferences(full, noBge, "semanticMatchScore")),
    },
    noKg: {
      cultureCoveragePercentagePointDifference: describePairedDifferences(pairedDifferences(full, noKg, "cultureCoveragePercent")),
      focusedThemeCountDifference: describePairedDifferences(pairedDifferences(full, noKg, "focusedThemeCount")),
    },
    noWeather: {
      rainyIndoorSharePercentagePointDifference: describePairedDifferences(
        pairedDifferences(rainyFull, rainyNoWeather, "indoorStaySharePercent"),
      ),
      rainyShelterScoreDifference: describePairedDifferences(
        pairedDifferences(rainyFull, rainyNoWeather, "shelterScore"),
      ),
      sunnyScenicScoreDifference: describePairedDifferences(
        pairedDifferences(sunnyFull, sunnyNoWeather, "scenicScore"),
      ),
    },
  };
}

function csvCell(value: unknown): string {
  if (value == null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return `${headers.join(",")}\n${rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")).join("\n")}\n`;
}

async function main(): Promise<void> {
  const scenariosDocument = JSON.parse(await readFile(path.join(OUTPUT_DIR, "scenarios.json"), "utf8")) as {
    scenarios: RouteExperimentScenario[];
  };
  const semanticDocument = JSON.parse(await readFile(path.join(OUTPUT_DIR, "semantic-fixtures.json"), "utf8")) as SemanticFixturesDocument;
  const matrixBytes = await readFile(path.join(ROOT, "src", "data", "nanjing-walking-matrix.json"));
  const oracleByScenario = new Map(scenariosDocument.scenarios.map((scenario) => [scenario.id, oracleFeasible(scenario)]));
  const actualFeasibleCount = [...oracleByScenario.values()].filter(Boolean).length;
  if (actualFeasibleCount !== 56) {
    throw new Error(`Exact oracle found ${actualFeasibleCount} feasible scenarios; expected 56.`);
  }
  for (const scenario of scenariosDocument.scenarios) {
    if (oracleByScenario.get(scenario.id) !== scenario.expectedFeasible) {
      throw new Error(`Scenario ${scenario.id} expectedFeasible disagrees with exact oracle.`);
    }
  }

  const rows: ExperimentRow[] = [];
  for (const scenario of scenariosDocument.scenarios) {
    const intent = semanticDocument.fixtures[scenario.templateId];
    if (!intent) throw new Error(`Missing semantic fixture for ${scenario.templateId}`);
    for (const config of CONFIG_IDS) {
      rows.push(runFunctionalScenario(scenario, intent, config, oracleByScenario.get(scenario.id)!));
    }
  }

  for (let index = 0; index < 30; index++) {
    const scenario = scenariosDocument.scenarios[index % scenariosDocument.scenarios.length];
    recommendTwoRoutes(scenario.candidatePoiIds, [], optionsFor(scenario, semanticDocument.fixtures[scenario.templateId], "full"));
  }
  const performanceRows: PerformanceRow[] = [];
  let sample = 1;
  for (const scenario of scenariosDocument.scenarios) {
    const intent = semanticDocument.fixtures[scenario.templateId];
    for (let repeat = 1; repeat <= 20; repeat++) {
      const started = performance.now();
      recommendTwoRoutes(scenario.candidatePoiIds, [], optionsFor(scenario, intent, "full"));
      performanceRows.push({
        sample,
        scenarioId: scenario.id,
        repeat,
        milliseconds: Number((performance.now() - started).toFixed(4)),
      });
      sample += 1;
    }
  }

  const fullRows = rows.filter((row) => row.config === "full");
  const performanceValues = performanceRows.map((row) => row.milliseconds);
  const over500Count = performanceValues.filter((value) => value > 500).length;
  const summary = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    experiment: {
      scenarioCount: scenariosDocument.scenarios.length,
      configurationCount: CONFIG_IDS.length,
      functionalRunCount: rows.length,
      oracleFeasibleCount: actualFeasibleCount,
      oracleInfeasibleCount: scenariosDocument.scenarios.length - actualFeasibleCount,
      performanceWarmupCount: 30,
      performanceSampleCount: performanceRows.length,
      performanceRepetitionsPerScenario: 20,
    },
    environment: {
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCpuCount: os.cpus().length,
      nodeVersion: process.version,
      gitSha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      walkingMatrixHash: createHash("sha256").update(matrixBytes).digest("hex"),
      walkingMatrixSourceHash: WALKING_MATRIX.sourceHash,
      walkingMatrixGeneratedAt: WALKING_MATRIX.generatedAt,
      cultureGraphVersion: CULTURE_GRAPH.version,
      cultureGraphGeneratedAt: CULTURE_GRAPH.generatedAt,
      bgeModelId: semanticDocument.model.id,
      bgeRevision: semanticDocument.model.revision,
      poiEmbeddingSourceHash: semanticDocument.model.poiEmbeddingSourceHash,
    },
    semanticPerformance: {
      coldLoadMs: semanticDocument.coldLoadMs,
      warmInferenceMs: describe(semanticDocument.warmInferenceMs),
    },
    configurations: Object.fromEntries(CONFIG_IDS.map((config) => [
      config,
      summarizeConfig(rows.filter((row) => row.config === config)),
    ])),
    baselineComparison: baselineComparison(fullRows),
    optimalComparison: optimalComparison(fullRows),
    ablations: ablationSummary(rows),
    performance: {
      ...describe(performanceValues),
      over500Count,
      over500RatePercent: rate(over500Count, performanceValues.length),
      thresholdMs: 500,
      gateP95Passed: (describe(performanceValues).p95 ?? Infinity) < 500,
      gateOver500RatePassed: (rate(over500Count, performanceValues.length) ?? Infinity) <= 1,
    },
    interpretationPolicy: {
      fixedEngineeringBenchmark: true,
      pValuesUsed: false,
      pairedBootstrapIterations: 10_000,
      pairedBootstrapSeed: 20260928,
      distanceAndTimeImprovementRequiresEqualCompletedPoiCount: true,
      liveDataClaimed: false,
    },
  };

  await writeFile(path.join(OUTPUT_DIR, "results.csv"), toCsv(rows as unknown as Record<string, unknown>[]), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "performance.csv"), toCsv(performanceRows as unknown as Record<string, unknown>[]), "utf8");
  await writeFile(path.join(OUTPUT_DIR, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`Wrote ${rows.length} functional rows and ${performanceRows.length} performance samples.`);
  console.log(`Performance P95 ${summary.performance.p95} ms; >500 ms ${summary.performance.over500RatePercent}%.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
