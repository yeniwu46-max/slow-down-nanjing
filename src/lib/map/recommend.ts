import { coordsDistanceKm, estimateWalk } from "./geo";
import { getPoiById } from "./pois";
import { alongRoadCoordinates, scenicShare, type RouteMode } from "./road-graph";
import type { MapPoi, MapRoute } from "./types";

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const out: T[][] = [];
  items.forEach((item, i) => {
    const rest = items.slice(0, i).concat(items.slice(i + 1));
    for (const perm of permutations(rest)) out.push([item, ...perm]);
  });
  return out;
}

function keyOf(order: MapPoi[]): string {
  return order.map((p) => p.id).join(">");
}

function isReverseOf(a: MapPoi[], b: MapPoi[]): boolean {
  return keyOf(a) === keyOf([...b].reverse());
}

function headingReversals(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let n = 0;
  for (let i = 2; i < coords.length; i++) {
    const ax = coords[i - 1][0] - coords[i - 2][0];
    const ay = coords[i - 1][1] - coords[i - 2][1];
    const bx = coords[i][0] - coords[i - 1][0];
    const by = coords[i][1] - coords[i - 1][1];
    const dot = ax * bx + ay * by;
    const mag = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (mag > 0 && dot / mag < -0.35) n += 1;
  }
  return n;
}

function plannedFrontScore(order: MapPoi[], planned: Set<string>): number {
  if (planned.size === 0) return 0;
  let score = 0;
  order.forEach((p, i) => {
    if (planned.has(p.id)) score += order.length - i;
  });
  return score;
}

function toRoute(
  id: string,
  name: string,
  tagline: string,
  order: MapPoi[],
  coords: [number, number][],
): MapRoute {
  const km = coordsDistanceKm(coords);
  const walk = estimateWalk(km, order.length);
  return {
    id,
    name,
    tagline,
    poiIds: order.map((p) => p.id),
    duration: walk.duration,
    distance: walk.distance,
    coordinates: coords,
  };
}

interface Candidate {
  order: MapPoi[];
  coords: [number, number][];
  km: number;
  scenic: number;
  reversals: number;
  planned: number;
}

function scoreShort(c: Candidate): number {
  return c.km + c.reversals * 0.35;
}

function scoreScenic(c: Candidate): number {
  return c.km * (1.15 - 0.7 * c.scenic) - c.planned * 0.85 + c.reversals * 0.12;
}

function names(order: MapPoi[]): string {
  return order.map((p) => p.name).join(" → ");
}

export function recommendTwoRoutes(
  poiIds: string[],
  plannedIds: string[] = [],
): {
  scenic: MapRoute;
  shortest: MapRoute;
} | null {
  const unique = [...new Set(poiIds)].filter(Boolean);
  if (unique.length < 2 || unique.length > 5) return null;

  const pois = unique
    .map((id) => getPoiById(id))
    .filter((p): p is MapPoi => Boolean(p));
  if (pois.length < 2) return null;

  const planned = new Set(plannedIds);
  const perms = permutations(pois);

  function evaluate(mode: RouteMode): Candidate[] {
    return perms.map((order) => {
      const coords = alongRoadCoordinates(
        order.map((p) => p.id),
        mode,
      );
      return {
        order,
        coords,
        km: coordsDistanceKm(coords),
        scenic: scenicShare(coords),
        reversals: headingReversals(coords),
        planned: plannedFrontScore(order, planned),
      };
    });
  }

  const shortCands = evaluate("short").sort((a, b) => scoreShort(a) - scoreShort(b));
  const scenicCands = evaluate("scenic").sort((a, b) => scoreScenic(a) - scoreScenic(b));

  const shortest = shortCands[0];
  let scenic =
    scenicCands.find(
      (c) =>
        !isReverseOf(c.order, shortest.order) &&
        keyOf(c.order) !== keyOf(shortest.order),
    ) ?? scenicCands[0];

  if (
    scenic &&
    (isReverseOf(scenic.order, shortest.order) || keyOf(scenic.order) === keyOf(shortest.order))
  ) {
    const next = scenicCands.find(
      (c) =>
        !isReverseOf(c.order, shortest.order) &&
        keyOf(c.order) !== keyOf(shortest.order),
    );
    if (next) scenic = next;
  }

  const plannedHint = planned.size
    ? "已标记待前往的点尽量靠前。"
    : "多走湖岸、城墙与梧桐，少走主干道捷径。";

  return {
    shortest: toRoute(
      "recommend-shortest",
      "少走路",
      `沿路折线更短、少回头。${names(shortest.order)}`,
      shortest.order,
      shortest.coords,
    ),
    scenic: toRoute(
      "recommend-scenic",
      "更慢更风景",
      `${plannedHint}${names(scenic.order)}`,
      scenic.order,
      scenic.coords,
    ),
  };
}
