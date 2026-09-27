import { describe, expect, it } from "vitest";
import { MAP_POIS } from "@/lib/map/pois";
import {
  clampPreferenceText,
  inferSemanticConstraints,
  rankPoisByKeyword,
} from "./rules";

describe("semantic preference rules", () => {
  it("ranks Republican-era architecture and plane-tree POIs near the top", () => {
    const ids = rankPoisByKeyword("想看民国建筑和梧桐街区", MAP_POIS)
      .slice(0, 5)
      .map((match) => match.poiId);
    expect(ids).toContain("yihe-road");
    expect(ids.some((id) => ["1912", "presidential-palace", "wutong-avenue"].includes(id))).toBe(true);
  });

  it("extracts cultural, low-energy, and rainy-day constraints", () => {
    const patch = inferSemanticConstraints("六朝遗迹，少走路，雨天尽量安排室内");
    expect(patch).toMatchObject({
      walkingAbility: "relaxed",
      weatherCondition: "rainy",
      preference: "culture",
    });
    expect(patch.cultureFocusTags).toContain("六朝文化");
    expect(patch.cultureFocusEntityIds).toContain("theme:six-dynasties");
  });

  it("returns no matches for empty text and clamps long input", () => {
    expect(rankPoisByKeyword("   ", MAP_POIS)).toEqual([]);
    expect(clampPreferenceText("慢".repeat(130))).toHaveLength(120);
  });

  it("is deterministic across repeated submissions", () => {
    const query = "雨天想安静地看博物馆";
    expect(rankPoisByKeyword(query, MAP_POIS)).toEqual(rankPoisByKeyword(query, MAP_POIS));
  });
});
