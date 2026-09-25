import type { Feature, FeatureCollection, Point } from "geojson";
import type {
  EnergyLevel,
  MapFilter,
  MapPoi,
  PoiDataSource,
  PoiState,
  SuitabilityScore,
  VenueType,
} from "./types";

function photos(id: string): string[] {
  return [1, 2, 3].map((n) => `/images/pois/${id}-${n}.jpg`);
}

type PoiCore = Omit<
  MapPoi,
  | "suggestedStayMinutes"
  | "cultureTags"
  | "venueType"
  | "energyLevel"
  | "rainyDaySuitability"
  | "restFacilities"
  | "accessibility"
  | "dataSources"
  | "operatingHours"
>;

interface PoiProfile {
  suggestedStayMinutes: number;
  cultureTags: string[];
  venueType: VenueType;
  energyLevel: EnergyLevel;
  rainyDaySuitability: SuitabilityScore;
  restFacilities: string[];
  accessibility: string;
  sourceLabel: string;
}

const BASE_POIS: PoiCore[] = [
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

const POI_PROFILES: Record<string, PoiProfile> = {
  "xuanwu-lake": {
    suggestedStayMinutes: 60, cultureTags: ["六朝文化", "金陵山水"], venueType: "outdoor",
    energyLevel: 2, rainyDaySuitability: 2, restFacilities: ["公共座椅", "公共卫生间"],
    accessibility: "主环湖路基本无障碍，支路需留意坡道", sourceLabel: "玄武湖景区公开资料",
  },
  "xuanwu-lake-pavilion": {
    suggestedStayMinutes: 40, cultureTags: ["园林文化", "赏樱文化"], venueType: "outdoor",
    energyLevel: 2, rainyDaySuitability: 2, restFacilities: ["亭廊", "公共座椅"],
    accessibility: "主游线可通行，部分临水小径较窄", sourceLabel: "玄武湖景区公开资料",
  },
  "jiming-temple": {
    suggestedStayMinutes: 50, cultureTags: ["佛教文化", "六朝文化"], venueType: "mixed",
    energyLevel: 3, rainyDaySuitability: 3, restFacilities: ["休息座椅"],
    accessibility: "入口及殿宇间有坡道和台阶", sourceLabel: "鸡鸣寺公开参观资料",
  },
  taicheng: {
    suggestedStayMinutes: 40, cultureTags: ["明城墙", "六朝文化"], venueType: "outdoor",
    energyLevel: 3, rainyDaySuitability: 1, restFacilities: ["观景休息点"],
    accessibility: "登城段以台阶为主，无障碍条件有限", sourceLabel: "南京城墙景区公开资料",
  },
  "nanjing-museum": {
    suggestedStayMinutes: 120, cultureTags: ["民国文化", "博物馆", "金陵文脉"], venueType: "indoor",
    energyLevel: 2, rainyDaySuitability: 5, restFacilities: ["座椅", "餐饮", "公共卫生间"],
    accessibility: "主要展馆设无障碍通道与电梯", sourceLabel: "南京博物院公开参观资料",
  },
  "presidential-palace": {
    suggestedStayMinutes: 90, cultureTags: ["民国文化", "近代史", "江南园林"], venueType: "mixed",
    energyLevel: 2, rainyDaySuitability: 4, restFacilities: ["座椅", "公共卫生间"],
    accessibility: "主游线可通行，部分历史建筑有门槛", sourceLabel: "南京总统府景区公开资料",
  },
  "confucius-temple": {
    suggestedStayMinutes: 75, cultureTags: ["秦淮文化", "儒家文化", "科举文化"], venueType: "mixed",
    energyLevel: 2, rainyDaySuitability: 3, restFacilities: ["餐饮", "公共卫生间", "沿街座椅"],
    accessibility: "步行街主路较平整，高峰时段较拥挤", sourceLabel: "夫子庙秦淮风光带公开资料",
  },
  laomendong: {
    suggestedStayMinutes: 70, cultureTags: ["老城南", "非遗", "市井文化"], venueType: "mixed",
    energyLevel: 2, rainyDaySuitability: 3, restFacilities: ["餐饮", "公共卫生间", "休息座椅"],
    accessibility: "主街可通行，石板支巷需谨慎", sourceLabel: "老门东街区公开资料",
  },
  "zhonghua-gate": {
    suggestedStayMinutes: 60, cultureTags: ["明城墙", "城门建筑"], venueType: "mixed",
    energyLevel: 4, rainyDaySuitability: 2, restFacilities: ["休息座椅", "公共卫生间"],
    accessibility: "瓮城游线包含较多台阶", sourceLabel: "南京城墙景区公开资料",
  },
  yuhuatai: {
    suggestedStayMinutes: 75, cultureTags: ["红色文化", "纪念文化"], venueType: "mixed",
    energyLevel: 3, rainyDaySuitability: 3, restFacilities: ["游客中心", "公共座椅", "公共卫生间"],
    accessibility: "主要道路可通行，园区范围较大", sourceLabel: "雨花台烈士陵园公开资料",
  },
  zhongshan: {
    suggestedStayMinutes: 90, cultureTags: ["钟山文化", "生态文化"], venueType: "outdoor",
    energyLevel: 4, rainyDaySuitability: 2, restFacilities: ["游客中心", "公共卫生间"],
    accessibility: "景区跨度较大，建议结合接驳交通", sourceLabel: "钟山风景区公开资料",
  },
  "sun-yat-sen": {
    suggestedStayMinutes: 80, cultureTags: ["民国文化", "纪念建筑"], venueType: "outdoor",
    energyLevel: 5, rainyDaySuitability: 1, restFacilities: ["平台休息点", "公共卫生间"],
    accessibility: "核心游线台阶密集，轮椅通行受限", sourceLabel: "中山陵园管理局公开资料",
  },
  "ming-xiaoling": {
    suggestedStayMinutes: 100, cultureTags: ["明代文化", "世界遗产", "神道文化"], venueType: "outdoor",
    energyLevel: 4, rainyDaySuitability: 2, restFacilities: ["公共座椅", "公共卫生间"],
    accessibility: "主神道较平缓，部分遗址路面不平", sourceLabel: "明孝陵景区公开资料",
  },
  "meihua-hill": {
    suggestedStayMinutes: 60, cultureTags: ["赏梅文化", "金陵园林"], venueType: "outdoor",
    energyLevel: 3, rainyDaySuitability: 2, restFacilities: ["公共座椅"],
    accessibility: "园路有缓坡，花期人流密集", sourceLabel: "钟山风景区公开资料",
  },
  "1912": {
    suggestedStayMinutes: 50, cultureTags: ["民国文化", "城市更新"], venueType: "mixed",
    energyLevel: 1, rainyDaySuitability: 4, restFacilities: ["餐饮", "室内休息空间", "公共卫生间"],
    accessibility: "街区主路平整，商户入口条件不一", sourceLabel: "南京1912街区公开资料",
  },
  "pioneer-bookstore": {
    suggestedStayMinutes: 60, cultureTags: ["当代文学", "城市阅读"], venueType: "indoor",
    energyLevel: 1, rainyDaySuitability: 5, restFacilities: ["室内座椅", "咖啡", "公共卫生间"],
    accessibility: "入口坡道情况需以现场为准", sourceLabel: "先锋书店公开资料",
  },
  "yihe-road": {
    suggestedStayMinutes: 70, cultureTags: ["民国文化", "公馆建筑", "梧桐文化"], venueType: "outdoor",
    energyLevel: 2, rainyDaySuitability: 2, restFacilities: ["沿街休息点"],
    accessibility: "街区道路整体平缓，部分人行道较窄", sourceLabel: "颐和路历史文化街区公开资料",
  },
  "yijiu-cafe": {
    suggestedStayMinutes: 45, cultureTags: ["民国建筑", "城市慢生活"], venueType: "indoor",
    energyLevel: 1, rainyDaySuitability: 5, restFacilities: ["室内座椅", "餐饮", "卫生间"],
    accessibility: "历史建筑入口条件需以现场为准", sourceLabel: "项目组场所资料整理",
  },
  "mochou-lake": {
    suggestedStayMinutes: 60, cultureTags: ["金陵山水", "古典园林"], venueType: "outdoor",
    energyLevel: 2, rainyDaySuitability: 2, restFacilities: ["亭廊", "公共座椅", "公共卫生间"],
    accessibility: "环湖主路较平整", sourceLabel: "莫愁湖景区公开资料",
  },
  "chaotian-palace": {
    suggestedStayMinutes: 75, cultureTags: ["明清建筑", "博物馆", "礼制文化"], venueType: "mixed",
    energyLevel: 2, rainyDaySuitability: 4, restFacilities: ["座椅", "公共卫生间"],
    accessibility: "院落存在门槛与台阶，部分区域可绕行", sourceLabel: "南京市博物馆公开资料",
  },
  dabaosi: {
    suggestedStayMinutes: 90, cultureTags: ["明代文化", "佛教文化", "考古遗址"], venueType: "indoor",
    energyLevel: 2, rainyDaySuitability: 5, restFacilities: ["室内座椅", "餐饮", "公共卫生间"],
    accessibility: "主要展陈空间设无障碍通道", sourceLabel: "大报恩寺遗址景区公开资料",
  },
  qixia: {
    suggestedStayMinutes: 120, cultureTags: ["佛教文化", "赏枫文化", "山林文化"], venueType: "outdoor",
    energyLevel: 5, rainyDaySuitability: 1, restFacilities: ["游客中心", "公共座椅", "公共卫生间"],
    accessibility: "山地游线坡度较大，无障碍范围有限", sourceLabel: "栖霞山风景区公开资料",
  },
  "wutong-avenue": {
    suggestedStayMinutes: 35, cultureTags: ["民国文化", "梧桐文化", "城市景观"], venueType: "outdoor",
    energyLevel: 2, rainyDaySuitability: 2, restFacilities: ["沿街休息点"],
    accessibility: "人行道总体可通行，路口需注意过街", sourceLabel: "项目组道路踏勘资料",
  },
};

function dataSources(sourceLabel: string): PoiDataSource[] {
  return [
    {
      label: sourceLabel,
      kind: sourceLabel.startsWith("项目组") ? "field-review" : "official",
      checkedAt: "2026-09",
    },
    { label: "OpenStreetMap 位置与道路数据", kind: "map", checkedAt: "2026-09" },
    { label: "项目组演示样本评估", kind: "field-review", checkedAt: "2026-09" },
  ];
}

const OPERATING_HOURS: Record<string, MapPoi["operatingHours"]> = {
  "nanjing-museum": { opensAtMinutes: 9 * 60, closesAtMinutes: 17 * 60, label: "09:00–17:00 样本" },
  "presidential-palace": { opensAtMinutes: 8 * 60 + 30, closesAtMinutes: 18 * 60, label: "08:30–18:00 样本" },
  "jiming-temple": { opensAtMinutes: 7 * 60, closesAtMinutes: 17 * 60 + 30, label: "07:00–17:30 样本" },
  taicheng: { opensAtMinutes: 8 * 60 + 30, closesAtMinutes: 17 * 60, label: "08:30–17:00 样本" },
  "sun-yat-sen": { opensAtMinutes: 8 * 60 + 30, closesAtMinutes: 17 * 60, label: "08:30–17:00 样本" },
  "ming-xiaoling": { opensAtMinutes: 7 * 60, closesAtMinutes: 18 * 60, label: "07:00–18:00 样本" },
  "chaotian-palace": { opensAtMinutes: 9 * 60, closesAtMinutes: 17 * 60, label: "09:00–17:00 样本" },
  dabaosi: { opensAtMinutes: 9 * 60, closesAtMinutes: 17 * 60 + 30, label: "09:00–17:30 样本" },
  "zhonghua-gate": { opensAtMinutes: 8 * 60 + 30, closesAtMinutes: 17 * 60, label: "08:30–17:00 样本" },
};

function defaultHours(venueType: VenueType): MapPoi["operatingHours"] {
  if (venueType === "indoor") {
    return { opensAtMinutes: 9 * 60, closesAtMinutes: 18 * 60, label: "09:00–18:00 样本" };
  }
  if (venueType === "mixed") {
    return { opensAtMinutes: 8 * 60, closesAtMinutes: 21 * 60, label: "08:00–21:00 样本" };
  }
  return { opensAtMinutes: 6 * 60, closesAtMinutes: 21 * 60, label: "06:00–21:00 样本" };
}

export const MAP_POIS: MapPoi[] = BASE_POIS.map((poi) => {
  const profile = POI_PROFILES[poi.id];
  if (!profile) throw new Error(`Missing POI profile: ${poi.id}`);
  const { sourceLabel, ...metadata } = profile;
  return {
    ...poi,
    ...metadata,
    dataSources: dataSources(sourceLabel),
    operatingHours: OPERATING_HOURS[poi.id] ?? defaultHours(metadata.venueType),
  };
});

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
