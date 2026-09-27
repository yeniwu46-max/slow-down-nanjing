import { describe, expect, it } from "vitest";
import {
  evaluateOptimizationOrder,
  solveBaselineOrder,
  solveExactTimeWindowRoute,
  type ExactOptimizationProblem,
} from "./exact-solver";

const problem: ExactOptimizationProblem = {
  travelTimeMatrix: [
    [0, 10, 5],
    [10, 0, 4],
    [5, 4, 0],
  ],
  visitDurations: [10, 20, 15],
  timeWindows: [
    { openMinutes: 540, closeMinutes: 720 },
    { openMinutes: 600, closeMinutes: 690 },
    { openMinutes: 540, closeMinutes: 660 },
  ],
  departureTimeMinutes: 540,
  timeBudgetMinutes: 100,
  startIndex: 0,
};

describe("时间窗精确验证求解器", () => {
  it("允许提前到达后的等待，并把等待计入预算", () => {
    const solution = evaluateOptimizationOrder(problem, [0, 1]);
    expect(solution).not.toBeNull();
    expect(solution!.scheduledVisits[1].arrivalMinutes).toBe(600);
    expect(solution!.waitMinutes).toBe(40);
    expect(solution!.totalMinutes).toBe(80);
  });

  it("排除闭馆后才完成游览的顺序", () => {
    const tight = structuredClone(problem);
    tight.timeWindows[1].closeMinutes = 615;
    expect(evaluateOptimizationOrder(tight, [0, 1])).toBeNull();
  });

  it("在访问数量优先下找到全局最短的可行顺序", () => {
    const solution = solveExactTimeWindowRoute(problem);
    expect(solution.status).toBe("optimal");
    expect(solution.order).toEqual([0, 2, 1]);
    expect(solution.order).toHaveLength(3);
    expect(solution.exploredOrders).toBe(5);
  });

  it("基准路线保持原始顺序并在预算外截断", () => {
    const tight = { ...problem, timeBudgetMinutes: 70 };
    const baseline = solveBaselineOrder(tight);
    expect(baseline.order).toEqual([0]);
    expect(baseline.omittedIndices).toEqual([1, 2]);
  });
});
