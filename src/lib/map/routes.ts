import type { Feature, FeatureCollection, LineString } from "geojson";
import { coordsDistanceKm, estimateWalk } from "./geo";
import { getPoiById, MAP_POIS } from "./pois";
import { alongRoadCoordinates } from "./road-graph";
import type { MapPoi, MapRoute } from "./types";

export function coordinatesFor(poiIds: string[]): [number, number][] {
  return alongRoadCoordinates(poiIds, "scenic");
}

export function routeFromPois(
  id: string,
  name: string,
  poiIds: string[],
  tagline?: string,
  coordinates?: [number, number][],
): MapRoute {
  const pois = poiIds
    .map((pid) => getPoiById(pid))
    .filter((p): p is MapPoi => Boolean(p));
  const line = coordinates?.length
    ? coordinates
    : alongRoadCoordinates(poiIds, "scenic");
  const km = coordsDistanceKm(line);
  const walk = estimateWalk(km, pois.length);
  return {
    id,
    name,
    tagline,
    poiIds,
    duration: walk.duration,
    distance: walk.distance,
    coordinates: line,
  };
}

/** 鸡鸣寺 → 台城 → 玄武湖 → 梁洲：沿城墙与湖岸，不穿湖心 */
const XUANWU_LINE: [number, number][] = [
  [118.7945, 32.0653],
  [118.7934, 32.0659],
  [118.7922, 32.0663],
  [118.7918, 32.0665],
  [118.7914, 32.0684],
  [118.7916, 32.0702],
  [118.7938, 32.0704],
  [118.7958, 32.0701],
  [118.7969, 32.0699],
  [118.8004, 32.0708],
  [118.8042, 32.0726],
  [118.8086, 32.0754],
  [118.8102, 32.0778],
  [118.8074, 32.0802],
  [118.8022, 32.0812],
  [118.7964, 32.0808],
  [118.7918, 32.0786],
  [118.7896, 32.0762],
  [118.7892, 32.0735],
];

/** 颐和路 → 中山东路梧桐 → 总统府 → 1912 → 南博：沿北京东路 / 中山东路，不斜穿 */
const WUTONG_LINE: [number, number][] = [
  [118.7782, 32.0621],
  [118.7842, 32.0618],
  [118.7906, 32.0616],
  [118.7984, 32.0612],
  [118.8048, 32.0576],
  [118.8092, 32.0518],
  [118.8106, 32.0472],
  [118.8102, 32.0446],
  [118.8054, 32.0448],
  [118.8008, 32.0449],
  [118.7969, 32.0449],
  [118.7946, 32.0458],
  [118.7925, 32.0468],
  [118.7969, 32.0449],
  [118.8036, 32.0447],
  [118.8102, 32.0446],
  [118.8166, 32.0434],
  [118.8212, 32.0432],
  [118.8255, 32.0432],
];

/** 颐和路巷弄南下五台山，再西南至莫愁湖 */
const YIHE_LINE: [number, number][] = [
  [118.7782, 32.0621],
  [118.7774, 32.0614],
  [118.7768, 32.0578],
  [118.7754, 32.0542],
  [118.7722, 32.0516],
  [118.7698, 32.0489],
  [118.768, 32.045],
  [118.7658, 32.0414],
  [118.7632, 32.0384],
  [118.7612, 32.0364],
];

/** 朝天宫沿秦淮河至夫子庙、老门东、大报恩寺，再沿南墙至中华门 */
const QINHUAI_LINE: [number, number][] = [
  [118.7786, 32.0378],
  [118.7816, 32.0348],
  [118.7846, 32.0308],
  [118.7872, 32.0264],
  [118.7889, 32.0224],
  [118.7906, 32.0194],
  [118.7912, 32.016],
  [118.7906, 32.0134],
  [118.7897, 32.0119],
  [118.7888, 32.0086],
  [118.7881, 32.0054],
  [118.7842, 32.0066],
  [118.7802, 32.0096],
  [118.7776, 32.0126],
  [118.7764, 32.0142],
];

/** 南博沿卫岗、梅花山、陵园路神道至中山陵，不翻紫金山顶 */
const PURPLE_LINE: [number, number][] = [
  [118.8255, 32.0432],
  [118.8302, 32.0428],
  [118.8364, 32.0426],
  [118.8424, 32.0432],
  [118.8488, 32.0452],
  [118.8466, 32.0482],
  [118.8432, 32.0512],
  [118.8412, 32.0536],
  [118.8406, 32.0547],
  [118.8428, 32.0566],
  [118.8452, 32.0586],
  [118.8482, 32.0604],
  [118.8506, 32.0584],
  [118.8533, 32.0556],
];

/** 台城沿墙至鸡鸣寺，再南下中华路至中华门 */
const WALL_LINE: [number, number][] = [
  [118.7918, 32.0665],
  [118.7932, 32.066],
  [118.7945, 32.0653],
  [118.7942, 32.0612],
  [118.7936, 32.0564],
  [118.7942, 32.0518],
  [118.7956, 32.048],
  [118.7969, 32.0449],
  [118.7942, 32.04],
  [118.79, 32.0352],
  [118.7862, 32.0302],
  [118.7832, 32.0252],
  [118.7806, 32.02],
  [118.7782, 32.0166],
  [118.7764, 32.0142],
];

/** 玄武湖沿南岸、中山门、中山东路至南博，再绕紫金山东麓出城至栖霞，不斜穿市区 */
const QIXIA_LINE: [number, number][] = [
  [118.7969, 32.0699],
  [118.7982, 32.0664],
  [118.8008, 32.0632],
  [118.8048, 32.0578],
  [118.8086, 32.052],
  [118.8124, 32.0468],
  [118.8166, 32.0428],
  [118.8212, 32.043],
  [118.8255, 32.0432],
  [118.8332, 32.0426],
  [118.8424, 32.0422],
  [118.8522, 32.0408],
  [118.8622, 32.0376],
  [118.8728, 32.0384],
  [118.8824, 32.0416],
  [118.8886, 32.0508],
  [118.8912, 32.0624],
  [118.8924, 32.0784],
  [118.8984, 32.0926],
  [118.9086, 32.1088],
  [118.9208, 32.1246],
  [118.9346, 32.1388],
  [118.9482, 32.1496],
  [118.9612, 32.1584],
];

export const XUANWU_LOOP = routeFromPois(
  "xuanwu-loop",
  "玄武湖环线",
  ["jiming-temple", "taicheng", "xuanwu-lake", "xuanwu-lake-pavilion"],
  "湖在右、墙在左，不必走完一圈",
  XUANWU_LINE,
);

export const WUTONG_ROUTE = routeFromPois(
  "wutong-walk",
  "梧桐慢行",
  [
    "yihe-road",
    "wutong-avenue",
    "presidential-palace",
    "1912",
    "nanjing-museum",
  ],
  "树影落在肩膀上再往前走",
  WUTONG_LINE,
);

export const YIHE_ROUTE = routeFromPois(
  "yihe-alley-walk",
  "颐和路巷弄",
  ["yihe-road", "yijiu-cafe", "pioneer-bookstore", "mochou-lake"],
  "公馆、咖啡、书店，城西的慢",
  YIHE_LINE,
);

export const QINHUAI_ROUTE = routeFromPois(
  "qinhuai-night",
  "秦淮灯影",
  ["chaotian-palace", "confucius-temple", "laomendong", "dabaosi", "zhonghua-gate"],
  "河风、灯影、城门，城南一条线",
  QINHUAI_LINE,
);

export const PURPLE_ROUTE = routeFromPois(
  "purple-mountain",
  "紫金林荫",
  ["nanjing-museum", "meihua-hill", "ming-xiaoling", "sun-yat-sen", "zhongshan"],
  "陵与山，把脚步放慢成台阶",
  PURPLE_LINE,
);

export const WALL_ROUTE = routeFromPois(
  "ming-wall",
  "明城墙段",
  ["taicheng", "jiming-temple", "presidential-palace", "zhonghua-gate"],
  "砖在脚下，树在抬头处",
  WALL_LINE,
);

export const QIXIA_ROUTE = routeFromPois(
  "qixia-day",
  "栖霞半日",
  ["xuanwu-lake", "nanjing-museum", "qixia"],
  "出城看山，秋叶最宜",
  QIXIA_LINE,
);

/** 中华门南下雨花台，沿中华路 / 雨花路，不穿住宅区 */
const YUHUA_LINE: [number, number][] = [
  [118.7764, 32.0142],
  [118.7768, 32.0116],
  [118.7774, 32.0088],
  [118.778, 32.0056],
  [118.7784, 32.0022],
  [118.7788, 31.9988],
  [118.7793, 31.9951],
];

export const YUHUA_ROUTE = routeFromPois(
  "yuhua-quiet",
  "雨花台静思",
  ["zhonghua-gate", "yuhuatai"],
  "城南一坡松，把话放轻",
  YUHUA_LINE,
);

export const MOCK_ROUTES: MapRoute[] = [
  XUANWU_LOOP,
  WUTONG_ROUTE,
  YIHE_ROUTE,
  QINHUAI_ROUTE,
  PURPLE_ROUTE,
  WALL_ROUTE,
  QIXIA_ROUTE,
  YUHUA_ROUTE,
];

export const ROUTE_BY_ID: Record<string, MapRoute> = Object.fromEntries(
  MOCK_ROUTES.map((r) => [r.id, r]),
);

export function routeToGeoJSON(route: MapRoute): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: route.id,
        geometry: {
          type: "LineString",
          coordinates: route.coordinates,
        },
        properties: {
          id: route.id,
          name: route.name,
          duration: route.duration,
          distance: route.distance,
        },
      },
    ],
  };
}

export function emptyRouteGeoJSON(): FeatureCollection<LineString> {
  return { type: "FeatureCollection", features: [] };
}

export function visitedRouteGeoJSON(
  pois: MapPoi[] = MAP_POIS,
): FeatureCollection<LineString> {
  const visited = pois.filter((p) => p.state === "visited");
  const coordinates: [number, number][] =
    visited.length >= 2
      ? alongRoadCoordinates(
          visited.map((p) => p.id),
          "short",
        )
      : [];

  const feature: Feature<LineString> = {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates,
    },
    properties: { name: "我的慢行轨迹" },
  };

  return { type: "FeatureCollection", features: coordinates.length >= 2 ? [feature] : [] };
}
