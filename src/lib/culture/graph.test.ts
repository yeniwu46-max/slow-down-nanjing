import { describe, expect, it } from "vitest";
import {
  buildRouteNarrative,
  calculateCultureCoverage,
  CULTURE_GRAPH,
  findVerifiedKnowledgePath,
  resolveCultureEntityIds,
} from "./graph";
import { validateKnowledgeGraph } from "./validate";
import { MAP_POIS } from "@/lib/map/pois";

describe("南京文化知识图谱", () => {
  it("满足首版数据门槛并可追溯", () => {
    const result = validateKnowledgeGraph(CULTURE_GRAPH, new Date("2026-09-27T12:00:00+08:00"));
    expect(result.errors).toEqual([]);
    expect(result.stats).toMatchObject({ places: 23, themes: 12, periods: 7 });
    expect(result.stats.claims).toBeGreaterThanOrEqual(90);
    const legacyTags = [...new Set(MAP_POIS.flatMap((poi) => poi.cultureTags))];
    expect(legacyTags).toHaveLength(42);
    expect(legacyTags.filter((tag) => !CULTURE_GRAPH.legacyTagMap[tag])).toEqual([]);
  });

  it("能识别过期数据、缺失来源与非法引用", () => {
    const altered = structuredClone(CULTURE_GRAPH);
    altered.claims[0].lastReviewedAt = "2020-01-01";
    altered.claims[0].sourceIds = [];
    altered.claims[0].objectId = "theme:missing";
    const result = validateKnowledgeGraph(altered, new Date("2026-09-27T12:00:00+08:00"));
    expect(result.errors.join("\n")).toContain("客体不存在");
    expect(result.errors.join("\n")).toContain("缺失来源");
    expect(result.warnings.join("\n")).toContain("超过 365 天");
  });

  it("六朝路线形成鸡鸣寺—台城—玄武湖的可追溯叙事链", () => {
    const route = ["jiming-temple", "taicheng", "xuanwu-lake"];
    const narrative = buildRouteNarrative(route, ["theme:six-dynasties"]);
    expect(narrative.stops.map((stop) => stop.poiId)).toEqual(route);
    expect(narrative.bridges).toHaveLength(2);
    expect(narrative.bridges.every((bridge) => bridge.claimIds.length > 0)).toBe(true);
    expect(narrative.sourceIds.length).toBeGreaterThan(0);
  });

  it("秦淮路线连接科举、老城南与明城墙", () => {
    const route = buildRouteNarrative(["confucius-temple", "laomendong", "zhonghua-gate"]);
    expect(route.bridges.map((bridge) => bridge.text).join(" ")).toMatch(/科举|老城南|明都|城门/);
  });

  it("路线顺序改变时叙事同步重排，找不到三跳关系时不编造承接", () => {
    const first = buildRouteNarrative(["jiming-temple", "taicheng"]);
    const reversed = buildRouteNarrative(["taicheng", "jiming-temple"]);
    expect(first.stops[0].poiId).toBe("jiming-temple");
    expect(reversed.stops[0].poiId).toBe("taicheng");
    expect(findVerifiedKnowledgePath("place:pioneer-bookstore", "place:qixia", 1)).toBeNull();
  });

  it("覆盖率使用候选主题为分母，并将重点主题权重设为 2", () => {
    const focus = resolveCultureEntityIds(["六朝文化"]);
    const result = calculateCultureCoverage(
      ["jiming-temple"],
      ["jiming-temple", "taicheng", "xuanwu-lake"],
      focus,
    );
    expect(result.coveredThemeIds).toContain("theme:six-dynasties");
    expect(result.uncoveredThemeIds.length).toBeGreaterThan(0);
    expect(result.coveredWeight).toBeGreaterThan(result.coveredThemeIds.length);
  });

  it("叙事计算保持在 50ms 内", () => {
    const started = performance.now();
    for (let index = 0; index < 30; index++) {
      buildRouteNarrative(["confucius-temple", "laomendong", "zhonghua-gate", "dabaosi"]);
    }
    expect((performance.now() - started) / 30).toBeLessThan(50);
  });
});
