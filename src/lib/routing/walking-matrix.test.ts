import { describe, expect, it } from "vitest";
import { MAP_POIS } from "@/lib/map/pois";
import {
  getWalkingMatrixLeg,
  validateWalkingMatrix,
  WALKING_MATRIX,
  walkingTimeMatrixMinutes,
} from "./walking-matrix";

describe("Valhalla 南京步行路网矩阵", () => {
  it("覆盖全部 23 个 POI 且数据结构有效", () => {
    expect(validateWalkingMatrix()).toEqual([]);
    expect(WALKING_MATRIX.locationIds).toHaveLength(23);
    expect(WALKING_MATRIX.provider).toBe("Valhalla");
    expect(WALKING_MATRIX.costing).toBe("pedestrian");
  });

  it("鸡鸣寺到台城使用真实路网而不是直线距离", () => {
    const leg = getWalkingMatrixLeg("jiming-temple", "taicheng");
    expect(leg).not.toBeNull();
    expect(leg!.distanceKm).toBeGreaterThan(0.5);
    expect(leg!.walkingMinutes).toBeGreaterThan(5);
  });

  it("能按候选地点生成 OR-Tools 所需分钟矩阵", () => {
    const ids = MAP_POIS.slice(0, 5).map((poi) => poi.id);
    const matrix = walkingTimeMatrixMinutes(ids, 1.2);
    expect(matrix).toHaveLength(5);
    expect(matrix.every((row) => row.length === 5)).toBe(true);
    expect(matrix.every((row, index) => row[index] === 0)).toBe(true);
  });
});
