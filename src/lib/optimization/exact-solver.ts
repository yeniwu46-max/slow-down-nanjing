export interface OptimizationTimeWindow {
  openMinutes: number;
  closeMinutes: number;
}
export interface ExactOptimizationProblem {
  travelTimeMatrix: number[][];
  visitDurations: number[];
  timeWindows: OptimizationTimeWindow[];
  departureTimeMinutes: number;
  timeBudgetMinutes: number;
  startIndex: number;
}

export interface ExactScheduledVisit {
  index: number;
  arrivalMinutes: number;
  departureMinutes: number;
  waitMinutes: number;
}

export interface ExactOptimizationSolution {
  status: "optimal" | "infeasible";
  order: number[];
  scheduledVisits: ExactScheduledVisit[];
  walkingMinutes: number;
  stayMinutes: number;
  waitMinutes: number;
  totalMinutes: number;
  omittedIndices: number[];
  exploredOrders: number;
  engine: "exact-enumeration";
}

function permutations<T>(items: T[]): T[][] {
  if (!items.length) return [[]];
  return items.flatMap((item, index) =>
    permutations(items.slice(0, index).concat(items.slice(index + 1)))
      .map((rest) => [item, ...rest]),
  );
}

export function evaluateOptimizationOrder(
  problem: ExactOptimizationProblem,
  order: number[],
): ExactOptimizationSolution | null {
  if (!order.length || order[0] !== problem.startIndex) return null;
  let cursor = problem.departureTimeMinutes;
  let walkingMinutes = 0;
  let stayMinutes = 0;
  let waitMinutes = 0;
  const scheduledVisits: ExactScheduledVisit[] = [];
  for (let position = 0; position < order.length; position++) {
    const index = order[position];
    if (position > 0) {
      const leg = problem.travelTimeMatrix[order[position - 1]]?.[index];
      if (!Number.isFinite(leg)) return null;
      cursor += leg;
      walkingMinutes += leg;
    }
    const window = problem.timeWindows[index];
    const duration = problem.visitDurations[index];
    if (!window || !Number.isFinite(duration)) return null;
    const wait = Math.max(0, window.openMinutes - cursor);
    const arrival = cursor + wait;
    const departure = arrival + duration;
    if (departure > window.closeMinutes) return null;
    waitMinutes += wait;
    stayMinutes += duration;
    scheduledVisits.push({
      index,
      arrivalMinutes: arrival,
      departureMinutes: departure,
      waitMinutes: wait,
    });
    cursor = departure;
  }
  const totalMinutes = cursor - problem.departureTimeMinutes;
  if (totalMinutes > problem.timeBudgetMinutes) return null;
  return {
    status: "optimal",
    order,
    scheduledVisits,
    walkingMinutes,
    stayMinutes,
    waitMinutes,
    totalMinutes,
    omittedIndices: problem.visitDurations.map((_, index) => index).filter((index) => !order.includes(index)),
    exploredOrders: 1,
    engine: "exact-enumeration",
  };
}

function betterSolution(
  candidate: ExactOptimizationSolution,
  current: ExactOptimizationSolution | null,
): boolean {
  if (!current) return true;
  if (candidate.order.length !== current.order.length) return candidate.order.length > current.order.length;
  if (candidate.totalMinutes !== current.totalMinutes) return candidate.totalMinutes < current.totalMinutes;
  if (candidate.walkingMinutes !== current.walkingMinutes) return candidate.walkingMinutes < current.walkingMinutes;
  return candidate.order.join(",") < current.order.join(",");
}

export function solveExactTimeWindowRoute(problem: ExactOptimizationProblem): ExactOptimizationSolution {
  const candidates = problem.visitDurations
    .map((_, index) => index)
    .filter((index) => index !== problem.startIndex);
  let best: ExactOptimizationSolution | null = null;
  let exploredOrders = 0;
  for (let visitCount = 0; visitCount <= candidates.length; visitCount++) {
    const subsets = combinations(candidates, visitCount);
    for (const subset of subsets) {
      for (const suffix of permutations(subset)) {
        exploredOrders += 1;
        const solution = evaluateOptimizationOrder(problem, [problem.startIndex, ...suffix]);
        if (solution && betterSolution(solution, best)) best = solution;
      }
    }
  }
  if (!best) {
    return {
      status: "infeasible",
      order: [],
      scheduledVisits: [],
      walkingMinutes: 0,
      stayMinutes: 0,
      waitMinutes: 0,
      totalMinutes: 0,
      omittedIndices: problem.visitDurations.map((_, index) => index),
      exploredOrders,
      engine: "exact-enumeration",
    };
  }
  return { ...best, exploredOrders };
}

export function solveBaselineOrder(problem: ExactOptimizationProblem): ExactOptimizationSolution {
  const order = [
    problem.startIndex,
    ...problem.visitDurations.map((_, index) => index).filter((index) => index !== problem.startIndex),
  ];
  for (let length = order.length; length >= 1; length--) {
    const solution = evaluateOptimizationOrder(problem, order.slice(0, length));
    if (solution) return { ...solution, exploredOrders: order.length - length + 1 };
  }
  return {
    status: "infeasible",
    order: [],
    scheduledVisits: [],
    walkingMinutes: 0,
    stayMinutes: 0,
    waitMinutes: 0,
    totalMinutes: 0,
    omittedIndices: problem.visitDurations.map((_, index) => index),
    exploredOrders: order.length,
    engine: "exact-enumeration",
  };
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (size > items.length) return [];
  const result: T[][] = [];
  for (let index = 0; index <= items.length - size; index++) {
    for (const rest of combinations(items.slice(index + 1), size - 1)) {
      result.push([items[index], ...rest]);
    }
  }
  return result;
}
