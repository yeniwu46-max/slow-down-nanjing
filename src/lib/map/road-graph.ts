import { coordsDistanceKm, haversineKm } from "./geo";
import { getPoiById } from "./pois";

export type RouteMode = "short" | "scenic";
type Kind = "scenic" | "street" | "trunk";

interface GraphNode {
  id: string;
  lng: number;
  lat: number;
}

interface GraphEdge {
  to: string;
  kind: Kind;
  via: [number, number][];
}

const KIND_WEIGHT: Record<RouteMode, Record<Kind, number>> = {
  short: { scenic: 1.12, street: 1, trunk: 0.88 },
  scenic: { scenic: 0.48, street: 1.02, trunk: 1.82 },
};

function N(id: string, lng: number, lat: number): GraphNode {
  return { id, lng, lat };
}

const NODES: GraphNode[] = [
  // POIs — 与 pois.ts 坐标一致
  N("jiming-temple", 118.7945, 32.0653),
  N("taicheng", 118.7918, 32.0665),
  N("xuanwu-lake", 118.7969, 32.0699),
  N("xuanwu-lake-pavilion", 118.7892, 32.0735),
  N("nanjing-museum", 118.8255, 32.0432),
  N("presidential-palace", 118.7969, 32.0449),
  N("confucius-temple", 118.7889, 32.0224),
  N("laomendong", 118.7897, 32.0119),
  N("zhonghua-gate", 118.7764, 32.0142),
  N("yuhuatai", 118.7793, 31.9951),
  N("zhongshan", 118.8533, 32.0556),
  N("sun-yat-sen", 118.8482, 32.0604),
  N("ming-xiaoling", 118.8406, 32.0547),
  N("meihua-hill", 118.8488, 32.0452),
  N("1912", 118.7925, 32.0468),
  N("pioneer-bookstore", 118.7698, 32.0489),
  N("yihe-road", 118.7782, 32.0621),
  N("yijiu-cafe", 118.7774, 32.0614),
  N("mochou-lake", 118.7612, 32.0364),
  N("chaotian-palace", 118.7786, 32.0378),
  N("dabaosi", 118.7881, 32.0054),
  N("qixia", 118.9612, 32.1584),
  N("wutong-avenue", 118.8102, 32.0446),
  // 途经折点：沿湖 / 沿墙 / 中山东路 / 秦淮 / 出城栖霞
  N("xuanwu-gate", 118.7838, 32.0772),
  N("xuanwu-n", 118.7988, 32.0806),
  N("xuanwu-e", 118.8102, 32.0738),
  N("xuanwu-s", 118.7988, 32.0632),
  N("jiefang-men", 118.8048, 32.0578),
  N("zhongshan-men", 118.8166, 32.0428),
  N("taiping-men", 118.8092, 32.0496),
  N("gulou", 118.7788, 32.0602),
  N("zhujiang", 118.7898, 32.0536),
  N("xinjiekou", 118.7846, 32.0438),
  N("jiankang", 118.7842, 32.0312),
  N("zhonghua-rd", 118.7808, 32.0264),
  N("weigang", 118.8332, 32.0424),
  N("maqun", 118.8622, 32.0376),
  N("huhe", 118.8784, 32.0518),
  N("yaohua", 118.8924, 32.0862),
  N("xianlin-w", 118.9252, 32.1184),
  N("qixia-ave", 118.9462, 32.1406),
  N("lingyuan", 118.8438, 32.0504),
  N("hanzhong", 118.7672, 32.0416),
  N("yuhua-rd", 118.7784, 32.0052),
  N("neiqiao", 118.7846, 32.0218),
];

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

function L(kind: Kind, a: string, b: string, via: [number, number][] = []): [Kind, string, string, [number, number][]] {
  return [kind, a, b, via];
}

const RAW_EDGES: [Kind, string, string, [number, number][]][] = [
  // 玄武湖岸，不穿湖心
  L("scenic", "taicheng", "xuanwu-gate", [[118.7912, 32.0698], [118.7876, 32.0738]]),
  L("scenic", "xuanwu-gate", "xuanwu-lake-pavilion", [[118.7864, 32.0762]]),
  L("scenic", "xuanwu-lake-pavilion", "xuanwu-n", [[118.7928, 32.0778], [118.7964, 32.0802]]),
  L("scenic", "xuanwu-n", "xuanwu-e", [[118.8048, 32.0796], [118.8092, 32.0772]]),
  L("scenic", "xuanwu-e", "xuanwu-lake", [[118.8064, 32.0718], [118.8012, 32.0704]]),
  L("scenic", "xuanwu-lake", "xuanwu-s", [[118.7976, 32.0668]]),
  L("scenic", "xuanwu-s", "taicheng", [[118.7948, 32.0648], [118.7928, 32.0656]]),
  L("scenic", "xuanwu-s", "jiming-temple", [[118.7962, 32.0644]]),
  L("scenic", "jiming-temple", "taicheng", [[118.7932, 32.0659]]),
  L("scenic", "xuanwu-s", "jiefang-men", [[118.8016, 32.0606]]),
  L("scenic", "jiefang-men", "xuanwu-e", [[118.8084, 32.0668]]),
  L("scenic", "jiefang-men", "taiping-men", [[118.8072, 32.0536]]),
  L("scenic", "taiping-men", "zhongshan-men", [[118.8128, 32.0468]]),

  // 明城墙 / 城内南北
  L("street", "jiming-temple", "zhujiang", [[118.7942, 32.0602], [118.7924, 32.0568]]),
  L("street", "zhujiang", "1912", [[118.7912, 32.0504]]),
  L("street", "1912", "presidential-palace", [[118.7948, 32.0456]]),
  L("street", "presidential-palace", "xinjiekou", [[118.7908, 32.0444]]),
  L("street", "zhujiang", "presidential-palace", [[118.7936, 32.0492]]),
  L("trunk", "xinjiekou", "jiankang", [[118.7842, 32.0378]]),
  L("scenic", "jiankang", "confucius-temple", [[118.7864, 32.0268]]),
  L("scenic", "confucius-temple", "neiqiao", [[118.7868, 32.0216]]),
  L("scenic", "neiqiao", "zhonghua-rd", []),
  L("scenic", "zhonghua-rd", "zhonghua-gate", [[118.7786, 32.0204]]),
  L("trunk", "xinjiekou", "zhonghua-rd", [[118.7824, 32.0356]]),
  L("street", "zhonghua-gate", "yuhua-rd", [[118.7772, 32.0096]]),
  L("street", "yuhua-rd", "yuhuatai", [[118.7788, 32.0002]]),
  L("scenic", "zhonghua-gate", "dabaosi", [[118.7804, 32.0108], [118.7848, 32.0072]]),

  // 秦淮河
  L("scenic", "chaotian-palace", "jiankang", [[118.7814, 32.0346]]),
  L("scenic", "confucius-temple", "laomendong", [
    [118.7906, 32.0194],
    [118.7912, 32.0162],
    [118.7906, 32.0136],
  ]),
  L("scenic", "laomendong", "dabaosi", [[118.7888, 32.0086]]),
  L("street", "chaotian-palace", "xinjiekou", [[118.7816, 32.0408]]),
  L("street", "mochou-lake", "chaotian-palace", [[118.7684, 32.0368]]),

  // 中山东路梧桐（不斜穿紫金山）
  L("scenic", "presidential-palace", "wutong-avenue", [
    [118.8004, 32.0448],
    [118.8056, 32.0447],
  ]),
  L("scenic", "wutong-avenue", "zhongshan-men", [[118.8138, 32.0436]]),
  L("scenic", "zhongshan-men", "nanjing-museum", [[118.8212, 32.0432]]),
  L("scenic", "nanjing-museum", "weigang", [[118.8294, 32.0428]]),
  L("scenic", "1912", "wutong-avenue", [
    [118.7969, 32.0449],
    [118.8032, 32.0447],
  ]),

  // 紫金山南麓神道，不翻山
  L("scenic", "weigang", "meihua-hill", [[118.8402, 32.0432], [118.8454, 32.0442]]),
  L("scenic", "meihua-hill", "lingyuan", [[118.8462, 32.0478]]),
  L("scenic", "lingyuan", "ming-xiaoling", [[118.8416, 32.0528]]),
  L("scenic", "ming-xiaoling", "sun-yat-sen", [[118.8432, 32.0568], [118.8458, 32.0588]]),
  L("scenic", "sun-yat-sen", "zhongshan", [[118.8508, 32.0582]]),
  L("street", "taiping-men", "lingyuan", [[118.8184, 32.0508], [118.8324, 32.0506]]),

  // 出城栖霞：沿宁镇 / 栖霞大道绕山，不斜穿市区或山体
  L("trunk", "weigang", "maqun", [[118.8424, 32.0412], [118.8524, 32.0392]]),
  L("trunk", "maqun", "huhe", [[118.8702, 32.0418]]),
  L("trunk", "huhe", "yaohua", [[118.8848, 32.0684]]),
  L("trunk", "xuanwu-e", "yaohua", [
    [118.8224, 32.0768],
    [118.8486, 32.0824],
    [118.8724, 32.0868],
  ]),
  L("trunk", "yaohua", "xianlin-w", [[118.9084, 32.1026]]),
  L("trunk", "xianlin-w", "qixia-ave", [[118.9364, 32.1308]]),
  L("trunk", "qixia-ave", "qixia", [[118.9538, 32.1504]]),
  L("street", "zhongshan", "huhe", [[118.8624, 32.0524]]),

  // 城西颐和 / 五台山
  L("scenic", "yihe-road", "yijiu-cafe", []),
  L("street", "yihe-road", "gulou", [[118.7824, 32.0612]]),
  L("street", "gulou", "jiming-temple", [[118.7864, 32.0624], [118.7908, 32.0642]]),
  L("street", "gulou", "pioneer-bookstore", [[118.7764, 32.0564], [118.7724, 32.0522]]),
  L("street", "yijiu-cafe", "pioneer-bookstore", [
    [118.7766, 32.0576],
    [118.7738, 32.0534],
  ]),
  L("street", "pioneer-bookstore", "hanzhong", [[118.7684, 32.0452]]),
  L("street", "hanzhong", "mochou-lake", [[118.7642, 32.0388]]),
  L("street", "gulou", "xinjiekou", [[118.7808, 32.0524]]),
];

const ADJ = new Map<string, GraphEdge[]>();
for (const node of NODES) ADJ.set(node.id, []);
for (const [kind, a, b, via] of RAW_EDGES) {
  if (!NODE_BY_ID.has(a) || !NODE_BY_ID.has(b)) continue;
  ADJ.get(a)!.push({ to: b, kind, via });
  ADJ.get(b)!.push({ to: a, kind, via: [...via].reverse() });
}

function nodeCoord(id: string): [number, number] {
  const n = NODE_BY_ID.get(id)!;
  return [n.lng, n.lat];
}

function edgeDistance(from: string, edge: GraphEdge): number {
  const pts: [number, number][] = [nodeCoord(from), ...edge.via, nodeCoord(edge.to)];
  return coordsDistanceKm(pts);
}

function dijkstra(start: string, goal: string, mode: RouteMode): string[] | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const used = new Set<string>();
  for (const n of NODES) dist.set(n.id, Infinity);
  dist.set(start, 0);

  while (used.size < NODES.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const n of NODES) {
      if (used.has(n.id)) continue;
      const d = dist.get(n.id) ?? Infinity;
      if (d < best) {
        best = d;
        u = n.id;
      }
    }
    if (u === null || best === Infinity) break;
    if (u === goal) break;
    used.add(u);
    for (const edge of ADJ.get(u) ?? []) {
      const w = edgeDistance(u, edge) * KIND_WEIGHT[mode][edge.kind];
      const alt = best + w;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, u);
      }
    }
  }

  if (!prev.has(goal) && start !== goal) return null;
  const path = [goal];
  let cur = goal;
  while (cur !== start) {
    const p = prev.get(cur);
    if (!p) return start === goal ? [start] : null;
    path.push(p);
    cur = p;
  }
  path.reverse();
  return path;
}

function expandPath(nodeIds: string[]): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i < nodeIds.length; i++) {
    const id = nodeIds[i];
    if (i === 0) {
      coords.push(nodeCoord(id));
      continue;
    }
    const prev = nodeIds[i - 1];
    const edge = (ADJ.get(prev) ?? []).find((e) => e.to === id);
    if (edge) {
      for (const v of edge.via) coords.push(v);
    }
    coords.push(nodeCoord(id));
  }
  return coords;
}

const LAKE_BOX = { minLng: 118.786, maxLng: 118.812, minLat: 32.066, maxLat: 32.082 };
const MOUNTAIN_BOX = { minLng: 118.832, maxLng: 118.868, minLat: 32.046, maxLat: 32.074 };

function segmentHits(
  a: [number, number],
  b: [number, number],
  box: typeof LAKE_BOX,
): boolean {
  const samples = 6;
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const lng = a[0] + (b[0] - a[0]) * t;
    const lat = a[1] + (b[1] - a[1]) * t;
    if (lng > box.minLng && lng < box.maxLng && lat > box.minLat && lat < box.maxLat) {
      return true;
    }
  }
  return false;
}

function manhattanVia(from: [number, number], to: [number, number]): [number, number][] {
  const midLngFirst: [number, number] = [to[0], from[1]];
  const midLatFirst: [number, number] = [from[0], to[1]];
  const hitsLng =
    segmentHits(from, midLngFirst, LAKE_BOX) ||
    segmentHits(midLngFirst, to, LAKE_BOX) ||
    segmentHits(from, midLngFirst, MOUNTAIN_BOX) ||
    segmentHits(midLngFirst, to, MOUNTAIN_BOX);
  const hitsLat =
    segmentHits(from, midLatFirst, LAKE_BOX) ||
    segmentHits(midLatFirst, to, LAKE_BOX) ||
    segmentHits(from, midLatFirst, MOUNTAIN_BOX) ||
    segmentHits(midLatFirst, to, MOUNTAIN_BOX);

  if (!hitsLng) return [from, midLngFirst, to];
  if (!hitsLat) return [from, midLatFirst, to];

  const around: [number, number] =
    from[1] > 32.05 ? [118.8166, 32.0428] : [118.8622, 32.0376];
  return [from, [around[0], from[1]], around, [around[0], to[1]], to];
}

function nearestNodeId(lng: number, lat: number): string {
  let best = NODES[0].id;
  let bestD = Infinity;
  for (const n of NODES) {
    const d = haversineKm(lat, lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      best = n.id;
    }
  }
  return best;
}

export function pairPolyline(
  fromId: string,
  toId: string,
  mode: RouteMode,
): [number, number][] {
  if (fromId === toId) {
    const p = getPoiById(fromId);
    return p ? [[p.lng, p.lat]] : [];
  }
  const fromPoi = getPoiById(fromId);
  const toPoi = getPoiById(toId);
  const start = NODE_BY_ID.has(fromId)
    ? fromId
    : fromPoi
      ? nearestNodeId(fromPoi.lng, fromPoi.lat)
      : null;
  const goal = NODE_BY_ID.has(toId)
    ? toId
    : toPoi
      ? nearestNodeId(toPoi.lng, toPoi.lat)
      : null;

  if (start && goal) {
    const path = dijkstra(start, goal, mode);
    if (path && path.length >= 2) {
      const coords = expandPath(path);
      if (fromPoi) coords[0] = [fromPoi.lng, fromPoi.lat];
      if (toPoi) coords[coords.length - 1] = [toPoi.lng, toPoi.lat];
      return coords;
    }
  }

  if (fromPoi && toPoi) {
    return manhattanVia([fromPoi.lng, fromPoi.lat], [toPoi.lng, toPoi.lat]);
  }
  return [];
}

export function alongRoadCoordinates(
  poiIds: string[],
  mode: RouteMode = "scenic",
): [number, number][] {
  const ids = poiIds.filter((id) => getPoiById(id));
  if (ids.length === 0) return [];
  if (ids.length === 1) {
    const p = getPoiById(ids[0])!;
    return [[p.lng, p.lat]];
  }
  const coords: [number, number][] = [];
  for (let i = 1; i < ids.length; i++) {
    const seg = pairPolyline(ids[i - 1], ids[i], mode);
    if (seg.length === 0) continue;
    if (coords.length === 0) coords.push(...seg);
    else coords.push(...seg.slice(1));
  }
  return coords;
}

export function scenicShare(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let scenic = 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const d = haversineKm(coords[i - 1][1], coords[i - 1][0], coords[i][1], coords[i][0]);
    total += d;
    const lng = (coords[i - 1][0] + coords[i][0]) / 2;
    const lat = (coords[i - 1][1] + coords[i][1]) / 2;
    const alongLake =
      lng > 118.784 && lng < 118.814 && lat > 32.062 && lat < 32.083;
    const alongWutong =
      lng > 118.792 && lng < 118.836 && lat > 32.041 && lat < 32.048;
    const alongQinhuai =
      lng > 118.774 && lng < 118.796 && lat > 32.004 && lat < 32.038;
    const alongWall =
      (lng > 118.788 && lng < 118.82 && lat > 32.04 && lat < 32.07) ||
      (lng > 118.774 && lng < 118.79 && lat > 32.012 && lat < 32.03);
    if (alongLake || alongWutong || alongQinhuai || alongWall) scenic += d;
  }
  return total === 0 ? 0 : scenic / total;
}
