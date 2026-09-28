import type { PlannerFeatureFlags } from "@/lib/map/recommend";
import type { RoutePreference, WalkingAbility } from "@/lib/map/planning";
import type { WeatherCondition } from "@/lib/weather/types";

export const EXPERIMENT_SEED = 20260928;

export const EXPERIMENT_CONFIGS = {
  full: {
    semanticPreference: true,
    cultureGraphScoring: true,
    weatherAdaptation: true,
  },
  noBge: {
    semanticPreference: false,
    cultureGraphScoring: true,
    weatherAdaptation: true,
  },
  noKg: {
    semanticPreference: true,
    cultureGraphScoring: false,
    weatherAdaptation: true,
  },
  noWeather: {
    semanticPreference: true,
    cultureGraphScoring: true,
    weatherAdaptation: false,
  },
} satisfies Record<string, PlannerFeatureFlags>;

export type ExperimentConfigId = keyof typeof EXPERIMENT_CONFIGS;
export type ExperimentProfileId =
  | "rain-short"
  | "morning-wait"
  | "closing-pressure"
  | "culture-day"
  | "weekend-night";

export interface RouteExperimentScenario {
  id: string;
  ordinal: number;
  templateId: string;
  templateName: string;
  profileId: ExperimentProfileId;
  profileName: string;
  candidatePoiIds: string[];
  startPoiId: string | null;
  budgetMinutes: number;
  departureTimeMinutes: number;
  walkingAbility: WalkingAbility;
  weatherCondition: WeatherCondition;
  preference: RoutePreference;
  closedPoiIds: string[];
  avoidCrowds: boolean;
  nightMode: boolean;
  query: string;
  expectedFeasible: boolean;
}

export interface DescriptiveStatistics {
  count: number;
  mean: number | null;
  median: number | null;
  standardDeviation: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  p95: number | null;
  min: number | null;
  max: number | null;
}

export interface PairedStatistics extends DescriptiveStatistics {
  wins: number;
  ties: number;
  losses: number;
  bootstrapMean95Ci: [number, number] | null;
}

function rounded(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

export function quantile(values: number[], probability: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function describe(values: number[]): DescriptiveStatistics {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) {
    return {
      count: 0,
      mean: null,
      median: null,
      standardDeviation: null,
      q1: null,
      q3: null,
      iqr: null,
      p95: null,
      min: null,
      max: null,
    };
  }
  const mean = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const variance = finite.length > 1
    ? finite.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (finite.length - 1)
    : 0;
  const q1 = quantile(finite, 0.25)!;
  const q3 = quantile(finite, 0.75)!;
  return {
    count: finite.length,
    mean: rounded(mean),
    median: rounded(quantile(finite, 0.5)!),
    standardDeviation: rounded(Math.sqrt(variance)),
    q1: rounded(q1),
    q3: rounded(q3),
    iqr: rounded(q3 - q1),
    p95: rounded(quantile(finite, 0.95)!),
    min: rounded(Math.min(...finite)),
    max: rounded(Math.max(...finite)),
  };
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrapMeanConfidenceInterval(
  pairedDifferences: number[],
  iterations = 10_000,
  seed = EXPERIMENT_SEED,
): [number, number] | null {
  const values = pairedDifferences.filter(Number.isFinite);
  if (!values.length) return null;
  const random = seededRandom(seed);
  const means = Array.from({ length: iterations }, () => {
    let sum = 0;
    for (let index = 0; index < values.length; index++) {
      sum += values[Math.floor(random() * values.length)];
    }
    return sum / values.length;
  });
  return [rounded(quantile(means, 0.025)!), rounded(quantile(means, 0.975)!)];
}

export function describePairedDifferences(
  differences: number[],
  tolerance = 1e-9,
): PairedStatistics {
  const finite = differences.filter(Number.isFinite);
  return {
    ...describe(finite),
    wins: finite.filter((value) => value > tolerance).length,
    ties: finite.filter((value) => Math.abs(value) <= tolerance).length,
    losses: finite.filter((value) => value < -tolerance).length,
    bootstrapMean95Ci: bootstrapMeanConfidenceInterval(finite),
  };
}

export function improvementPercent(baseline: number, intelligent: number): number | null {
  if (!Number.isFinite(baseline) || !Number.isFinite(intelligent) || baseline === 0) return null;
  return rounded(((baseline - intelligent) / baseline) * 100);
}

