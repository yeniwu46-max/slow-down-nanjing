import type { Feature, FeatureCollection, Point } from "geojson";
import type { MapFilter, MapPoi, PoiState } from "./types";

function photos(id: string): string[] {
  return [1, 2, 3].map((n) => `/images/pois/${id}-${n}.jpg`);
}

export const MAP_POIS: MapPoi[] = [
  {
    id: "xuanwu-lake",
    name: "玄武湖公园",
    lng: 118.7969,
    lat: 32.0699,
    category: "自然风景",
    state: "unexplored",
    description: "六朝烟水，湖光山色。环洲到梁洲，不必赶完一圈。",
    photos: photos("xuanwu-lake"),
  },
  {
    id: "xuanwu-lake-pavilion",
    name: "玄武湖梁洲",
    lng: 118.7892,
    lat: 32.0735,
    category: "自然风景",
    state: "unexplored",
    description: "梁洲赏樱，湖风把城墙影子摊在水上。",
    photos: photos("xuanwu-lake-pavilion"),
  },
  {
    id: "jiming-temple",
    name: "鸡鸣寺",
    lng: 118.7945,
    lat: 32.0653,
    category: "文化古迹",
    state: "unexplored",
    description: "古刹樱影，台城脚下的一抹禅意。",
    photos: photos("jiming-temple"),
  },
  {
    id: "taicheng",
    name: "台城",
    lng: 118.7918,
    lat: 32.0665,
    category: "文化古迹",
    state: "unexplored",
    description: "明城墙遗迹，俯瞰玄武湖的最佳视角。",
    photos: photos("taicheng"),
  },
  {
    id: "nanjing-museum",
    name: "南京博物院",
    lng: 118.8255,
    lat: 32.0432,
    category: "文化古迹",
    state: "unexplored",
    description: "民国建筑与馆藏文物，感受金陵文脉。",
    photos: photos("nanjing-museum"),
  },
  {
    id: "presidential-palace",
    name: "总统府",
    lng: 118.7969,
    lat: 32.0449,
    category: "文化古迹",
    state: "unexplored",
    description: "近代史缩影，园林与建筑交织。",
    photos: photos("presidential-palace"),
  },
  {
    id: "confucius-temple",
    name: "夫子庙",
    lng: 118.7889,
    lat: 32.0224,
    category: "街巷小巷",
    state: "unexplored",
    description: "秦淮河畔，灯火与书声并存。",
    photos: photos("confucius-temple"),
  },
  {
    id: "laomendong",
    name: "老门东",
    lng: 118.7897,
    lat: 32.0119,
    category: "街巷小巷",
    state: "unexplored",
    description: "老城南巷弄，文艺小店与梧桐影。",
    photos: photos("laomendong"),
  },
  {
    id: "zhonghua-gate",
    name: "中华门",
    lng: 118.7764,
    lat: 32.0142,
    category: "文化古迹",
    state: "unexplored",
    description: "明朝都城正南门，瓮城层层，可走可看。",
    photos: photos("zhonghua-gate"),
  },
  {
    id: "yuhuatai",
    name: "雨花台",
    lng: 118.7793,
    lat: 31.9951,
    category: "文化古迹",
    state: "unexplored",
    description: "雨花石与纪念林，城市南端的静思之地。",
    photos: photos("yuhuatai"),
  },
  {
    id: "zhongshan",
    name: "钟山风景区",
    lng: 118.8533,
    lat: 32.0556,
    category: "自然风景",
    state: "unexplored",
    description: "紫金山际，明孝陵与梧桐大道。",
    photos: photos("zhongshan"),
  },
  {
    id: "sun-yat-sen",
    name: "中山陵",
    lng: 118.8482,
    lat: 32.0604,
    category: "文化古迹",
    state: "unexplored",
    description: "台阶是给脚步用的标点，把呼吸交给松风。",
    photos: photos("sun-yat-sen"),
  },
  {
    id: "ming-xiaoling",
    name: "明孝陵",
    lng: 118.8406,
    lat: 32.0547,
    category: "文化古迹",
    state: "unexplored",
    description: "神道石象生把人放回更早的朝代。",
    photos: photos("ming-xiaoling"),
  },
  {
    id: "meihua-hill",
    name: "梅花山",
    lng: 118.8488,
    lat: 32.0452,
    category: "自然风景",
    state: "unexplored",
    description: "钟山南麓，冬末春初梅花如雪。",
    photos: photos("meihua-hill"),
  },
  {
    id: "1912",
    name: "1912街区",
    lng: 118.7925,
    lat: 32.0468,
    category: "文艺生活",
    state: "unexplored",
    description: "民国风情街区，咖啡与慢生活。",
    photos: photos("1912"),
  },
  {
    id: "pioneer-bookstore",
    name: "先锋书店（五台山店）",
    lng: 118.7698,
    lat: 32.0489,
    category: "文艺生活",
    state: "unexplored",
    description: "十字架下的阅读空间，适合独自静处。",
    photos: photos("pioneer-bookstore"),
  },
  {
    id: "yihe-road",
    name: "颐和路公馆区",
    lng: 118.7782,
    lat: 32.0621,
    category: "街巷小巷",
    state: "unexplored",
    description: "法国梧桐夹道，青砖灰瓦，门牌安静得像还在等人。",
    photos: photos("yihe-road"),
  },
  {
    id: "yijiu-cafe",
    name: "颐和路咖啡馆",
    lng: 118.7774,
    lat: 32.0614,
    category: "文艺生活",
    state: "unexplored",
    description: "梧桐树影里的老洋房咖啡。",
    photos: photos("yijiu-cafe"),
  },
  {
    id: "mochou-lake",
    name: "莫愁湖",
    lng: 118.7612,
    lat: 32.0364,
    category: "自然风景",
    state: "unexplored",
    description: "城西一勺水，清晨最安静。",
    photos: photos("mochou-lake"),
  },
  {
    id: "chaotian-palace",
    name: "朝天宫",
    lng: 118.7786,
    lat: 32.0378,
    category: "文化古迹",
    state: "unexplored",
    description: "江南官署遗存，南京博物院朝天宫分馆所在。",
    photos: photos("chaotian-palace"),
  },
  {
    id: "dabaosi",
    name: "大报恩寺遗址",
    lng: 118.7881,
    lat: 32.0054,
    category: "文化古迹",
    state: "unexplored",
    description: "琉璃塔遗址与地下宫，城南的一层旧时光。",
    photos: photos("dabaosi"),
  },
  {
    id: "qixia",
    name: "栖霞山",
    lng: 118.9612,
    lat: 32.1584,
    category: "自然风景",
    state: "unexplored",
    description: "秋叶染山，栖霞寺藏在红枫里。",
    photos: photos("qixia"),
  },
  {
    id: "wutong-avenue",
    name: "梧桐大道",
    lng: 118.8102,
    lat: 32.0446,
    category: "自然风景",
    state: "unexplored",
    description: "中山东路林荫，树冠把一条街变成绿廊。",
    photos: photos("wutong-avenue"),
  },
];

export function filterPois(
  filter: MapFilter,
  pois: MapPoi[] = MAP_POIS,
): MapPoi[] {
  if (filter === "全部") return pois;
  return pois.filter((p) => p.category === filter);
}

export function getPoiById(
  id: string,
  pois: MapPoi[] = MAP_POIS,
): MapPoi | undefined {
  return pois.find((p) => p.id === id);
}

export function poisToGeoJSON(pois: MapPoi[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pois.map(
      (poi): Feature<Point> => ({
        type: "Feature",
        id: poi.id,
        geometry: {
          type: "Point",
          coordinates: [poi.lng, poi.lat],
        },
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          state: poi.state,
          description: poi.description ?? "",
        },
      }),
    ),
  };
}

export function getPoisByState(
  state: PoiState,
  pois: MapPoi[] = MAP_POIS,
): MapPoi[] {
  return pois.filter((p) => p.state === state);
}

export function getMapStats(pois: MapPoi[] = MAP_POIS, routeCount = 8) {
  const visited = pois.filter((p) => p.state === "visited").length;
  const planned = pois.filter((p) => p.state === "planned").length;
  return {
    visitedCount: visited,
    plannedCount: planned,
    totalCount: pois.length,
    routeCount,
  };
}

export function applyPoiStates(
  states: Record<string, PoiState>,
  pois: MapPoi[] = MAP_POIS,
): MapPoi[] {
  return pois.map((poi) => ({
    ...poi,
    state: states[poi.id] ?? poi.state,
  }));
}
