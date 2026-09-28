import { describe, expect, it } from "vitest";
import scenariosJson from "../../../experiments/route-planning/scenarios.json";
import {
  EXPERIMENT_CONFIGS,
  bootstrapMeanConfidenceInterval,
  describe as describeValues,
  describePairedDifferences,
  improvementPercent,
  quantile,
  type RouteExperimentScenario,
} from "./route-experiment";
import { MAP_POIS } from "../map/pois";

const scenarios = scenariosJson.scenarios as RouteExperimentScenario[];

describe("route experiment statistics", () => {
  it("uses interpolated quantiles and sample standard deviation", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(describeValues([1, 2, 3, 4])).toMatchObject({
      count: 4,
      mean: 2.5,
      median: 2.5,
      q1: 1.75,
      q3: 3.25,
      iqr: 1.5,
    });
  });

  it("produces a deterministic paired bootstrap interval", () => {
    const first = bootstrapMeanConfidenceInterval([1, 2, 3, 4], 1000, 20260928);
    const second = bootstrapMeanConfidenceInterval([1, 2, 3, 4], 1000, 20260928);
    expect(first).toEqual(second);
    expect(first?.[0]).toBeLessThanOrEqual(2.5);
    expect(first?.[1]).toBeGreaterThanOrEqual(2.5);
  });

  it("counts paired wins, ties and losses without p-values", () => {
    expect(describePairedDifferences([2, 0, -1, 3])).toMatchObject({
      wins: 2,
      ties: 1,
      losses: 1,
    });
  });

  it("handles zero baselines without NaN or infinity", () => {
    expect(improvementPercent(100, 80)).toBe(20);
    expect(improvementPercent(0, 0)).toBeNull();
  });
});

describe("fixed route experiment scenarios", () => {
  it("contains the exact 12 by 5 balanced benchmark", () => {
    expect(scenarios).toHaveLength(60);
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(60);
    const templates = new Map<string, number>();
    const profiles = new Map<string, number>();
    scenarios.forEach((scenario) => {
      templates.set(scenario.templateId, (templates.get(scenario.templateId) ?? 0) + 1);
      profiles.set(scenario.profileId, (profiles.get(scenario.profileId) ?? 0) + 1);
    });
    expect([...templates.values()]).toEqual(Array.from({ length: 12 }, () => 5));
    expect([...profiles.values()]).toEqual(Array.from({ length: 5 }, () => 12));
  });

  it("contains 56 positive cases and four deliberate negative controls", () => {
    expect(scenarios.filter((scenario) => scenario.expectedFeasible)).toHaveLength(56);
    expect(scenarios.filter((scenario) => !scenario.expectedFeasible)).toHaveLength(4);
  });

  it("references only valid unique groups of two to five POIs", () => {
    const poiIds = new Set(MAP_POIS.map((poi) => poi.id));
    scenarios.forEach((scenario) => {
      expect(scenario.candidatePoiIds.length).toBeGreaterThanOrEqual(2);
      expect(scenario.candidatePoiIds.length).toBeLessThanOrEqual(5);
      expect(new Set(scenario.candidatePoiIds).size).toBe(scenario.candidatePoiIds.length);
      expect(scenario.candidatePoiIds.every((id) => poiIds.has(id))).toBe(true);
    });
  });

  it("defines four independent, single-factor configurations", () => {
    expect(EXPERIMENT_CONFIGS.full).toEqual({
      semanticPreference: true,
      cultureGraphScoring: true,
      weatherAdaptation: true,
    });
    expect(EXPERIMENT_CONFIGS.noBge).toEqual({ ...EXPERIMENT_CONFIGS.full, semanticPreference: false });
    expect(EXPERIMENT_CONFIGS.noKg).toEqual({ ...EXPERIMENT_CONFIGS.full, cultureGraphScoring: false });
    expect(EXPERIMENT_CONFIGS.noWeather).toEqual({ ...EXPERIMENT_CONFIGS.full, weatherAdaptation: false });
  });
});

