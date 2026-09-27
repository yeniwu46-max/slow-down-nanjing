import { describe, expect, it } from "vitest";
import { getWalkingMatrixLeg } from "../routing/walking-matrix";
import { getPoiById } from "./pois";
import { recommendTwoRoutes, type RecommendationOptions } from "./recommend";

function options(overrides: Partial<RecommendationOptions> = {}): RecommendationOptions {
  return {
    startId: null,
    preference: "efficiency",
    timeBudgetMinutes: 240,
    walkingFactor: 1,
    weatherCondition: "cloudy",
    departureTimeMinutes: 10 * 60,
    closedPoiIds: [],
    dataUpdatedAt: "2026-09-27T00:00:00.000Z",
    dataStatus: "测试快照",
    ...overrides,
  };
}

describe("route algorithm comparison", () => {
  it("uses the Valhalla walking matrix for inter-POI time and distance", () => {
    const result = recommendTwoRoutes(
      ["jiming-temple", "taicheng"],
      [],
      options({ startId: "jiming-temple" }),
    );
    const leg = getWalkingMatrixLeg("jiming-temple", "taicheng")!;
    expect(result).not.toBeNull();
    expect(result!.shortest.metrics!.walkingMinutes).toBe(Math.ceil(leg.durationSeconds / 60));
    expect(result!.shortest.metrics!.distanceKm).toBeCloseTo(leg.distanceKm, 5);
    expect(result!.shortest.routingData?.provider).toBe("Valhalla");
  });

  it("counts waiting before opening and keeps the route inside the hard budget", () => {
    const result = recommendTwoRoutes(
      ["nanjing-museum", "presidential-palace"],
      [],
      options({
        startId: "nanjing-museum",
        departureTimeMinutes: 8 * 60 + 30,
      }),
    );
    expect(result).not.toBeNull();
    expect(result!.shortest.scheduledStops?.[0].waitMinutes).toBe(30);
    expect(result!.shortest.metrics!.waitMinutes).toBe(30);
    expect(
      result!.shortest.metrics!.walkingMinutes
      + result!.shortest.metrics!.stayMinutes
      + result!.shortest.metrics!.waitMinutes,
    ).toBeLessThanOrEqual(240);
  });

  it("does not schedule a venue that cannot be completed before closing", () => {
    const result = recommendTwoRoutes(
      ["nanjing-museum", "presidential-palace"],
      [],
      options({ departureTimeMinutes: 16 * 60 + 50, timeBudgetMinutes: 60 }),
    );
    expect(result).not.toBeNull();
    expect(result!.shortest.poiIds).not.toContain("nanjing-museum");
    for (const stop of result!.shortest.scheduledStops ?? []) {
      expect(stop.departureMinutes).toBeLessThanOrEqual(getPoiById(stop.poiId)!.operatingHours.closesAtMinutes);
    }
  });

  it("publishes baseline, intelligent and exhaustive optimal verification", () => {
    const startedAt = performance.now();
    const result = recommendTwoRoutes(
      ["jiming-temple", "taicheng", "xuanwu-lake", "presidential-palace", "1912"],
      [],
      options({ preference: "culture", timeBudgetMinutes: 180 }),
    );
    const elapsed = performance.now() - startedAt;
    const comparison = result!.shortest.algorithmComparison!;
    expect(comparison.baseline.label).toBe("基准路线");
    expect(comparison.intelligent.label).toBe("智能路线");
    expect(comparison.optimal.label).toBe("最优验证路线");
    expect(comparison.exactValidation).toBe(true);
    expect(comparison.exploredOrders).toBeGreaterThan(100);
    expect(comparison.optimal.poiIds.length).toBeGreaterThanOrEqual(comparison.intelligent.poiIds.length);
    expect(elapsed).toBeLessThan(500);
  });
});
