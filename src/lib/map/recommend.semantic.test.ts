import { describe, expect, it } from "vitest";
import { recommendTwoRoutes } from "./recommend";
import type { SemanticIntent } from "../semantic/types";

const semanticIntent: SemanticIntent = {
  query: "民国建筑和梧桐街区",
  provider: "bge-local",
  modelId: "bge-small-zh-v1.5",
  modelRevision: "test",
  inferredPatch: { preference: "culture", cultureFocusTags: ["民国文化"] },
  matches: [
    { poiId: "yihe-road", score: 100, matchedTags: ["民国文化"], matchedKnowledgeEntityIds: ["theme:republican"], reasons: ["文化主题：民国文化"] },
    { poiId: "1912", score: 82, matchedTags: ["民国文化"], matchedKnowledgeEntityIds: ["theme:republican"], reasons: ["文化主题：民国文化"] },
  ],
  inferenceMs: 18,
  createdAt: "2026-09-27T00:00:00.000Z",
};

describe("semantic route scoring", () => {
  it("carries semantic affinity into metrics and explanations", () => {
    const result = recommendTwoRoutes(["yihe-road", "1912"], [], {
      startId: "yihe-road",
      preference: "culture",
      timeBudgetMinutes: 240,
      walkingFactor: 1,
      weatherCondition: "cloudy",
      departureTimeMinutes: 10 * 60,
      closedPoiIds: [],
      cultureFocusTags: ["民国文化"],
      dataUpdatedAt: "2026-09-27T00:00:00.000Z",
      dataStatus: "test",
      semanticIntent,
    });
    expect(result).not.toBeNull();
    expect(result!.shortest.metrics!.semanticMatchScore).toBeGreaterThan(80);
    expect(result!.shortest.explanations?.some((item) => item.id === "semantic")).toBe(true);
  });
});
