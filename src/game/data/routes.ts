import type { GameProgress, RouteDefinition, RouteId, RouteProgress } from "@/game/types";

export const ROUTE_ORDER: RouteId[] = ["xuanwu", "wutong", "zijin", "qinhuai"];

export const GAME_ROUTES: RouteDefinition[] = [
  {
    id: "xuanwu",
    title: "玄武湖 · 湖光缓行",
    subtitle: "湖面没有催促，先听一会儿风。",
    sceneMood: "雾蓝、湖面、水波、远山",
    intro: "轻点湖面，让涟漪慢慢展开。",
    letter: "把急促留在岸上。",
    stamp: "湖光缓行",
    interaction: "ripple",
    gestureHint: "轻点湖面，等涟漪散开",
    palette: {
      bg: "#d8e2e5",
      ink: "#476376",
      accent: "#6e8ea4",
      soft: "#eef4f3",
    },
    fragments: [
      { id: "xuanwu-ripple", routeId: "xuanwu", name: "水波", symbol: "∿", slotId: "xuanwu-slot-1", hint: "点开第一圈涟漪", lore: "一圈圈把脚步放慢。", image: "/images/game/xuanwu-ripple.jpg", x: 0.25, y: 0.54 },
      { id: "xuanwu-bird", routeId: "xuanwu", name: "候鸟", symbol: "⌁", slotId: "xuanwu-slot-2", hint: "听见湖上的轻影", lore: "掠过水面，不催谁。", image: "/images/game/xuanwu-bird.jpg", x: 0.55, y: 0.34 },
      { id: "xuanwu-stone", routeId: "xuanwu", name: "湖石", symbol: "◒", slotId: "xuanwu-slot-3", hint: "在岸边停一下", lore: "岸石记得每一次停驻。", image: "/images/game/xuanwu-stone.jpg", x: 0.77, y: 0.62 },
    ],
  },
  {
    id: "wutong",
    title: "颐和路 · 梧桐回血",
    subtitle: "一片叶子，也有它落下的方向。",
    sceneMood: "灰绿、暖光、老街、梧桐影",
    intro: "拖动风向线，把落叶送到留白处。",
    letter: "风会替你翻过这一页。",
    stamp: "梧桐回血",
    interaction: "wind",
    gestureHint: "顺着风向拖一拖",
    palette: {
      bg: "#e2e2d7",
      ink: "#566457",
      accent: "#859386",
      soft: "#f4efe4",
    },
    fragments: [
      { id: "wutong-leaf", routeId: "wutong", name: "叶脉", symbol: "⌇", slotId: "wutong-slot-1", hint: "拖住叶脉的方向", lore: "叶子知道该往哪落。", image: "/images/game/wutong-leaf.jpg", x: 0.29, y: 0.33 },
      { id: "wutong-postbox", routeId: "wutong", name: "邮筒", symbol: "▤", slotId: "wutong-slot-2", hint: "把旧信放慢", lore: "信可以不急着寄出。", image: "/images/game/wutong-postbox.jpg", x: 0.52, y: 0.57 },
      { id: "wutong-window", routeId: "wutong", name: "窗影", symbol: "▥", slotId: "wutong-slot-3", hint: "窗里有一束暖光", lore: "梧桐把光切成格子。", image: "/images/game/wutong-window.jpg", x: 0.78, y: 0.41 },
    ],
  },
  {
    id: "zijin",
    title: "紫金山 · 山息静养",
    subtitle: "慢一点，听见石阶与云的距离。",
    sceneMood: "松石绿、山雾、石阶、树影",
    intro: "轻扫云雾，山路会自己显现。",
    letter: "慢一点，山也不会走远。",
    stamp: "山息静养",
    interaction: "mist",
    gestureHint: "扫开山雾，路会自己显现",
    palette: {
      bg: "#d9dfd8",
      ink: "#455b52",
      accent: "#60776c",
      soft: "#edf1e9",
    },
    fragments: [
      { id: "zijin-step", routeId: "zijin", name: "石阶", symbol: "▱", slotId: "zijin-slot-1", hint: "扫开低处的雾", lore: "台阶是给呼吸用的。", image: "/images/game/zijin-step.jpg", x: 0.26, y: 0.65 },
      { id: "zijin-pine", routeId: "zijin", name: "松枝", symbol: "〽", slotId: "zijin-slot-2", hint: "山风掠过松针", lore: "松针把风声写细。", image: "/images/game/zijin-pine.jpg", x: 0.5, y: 0.36 },
      { id: "zijin-cloud", routeId: "zijin", name: "云气", symbol: "◌", slotId: "zijin-slot-3", hint: "云停在山腰", lore: "云也不赶路。", image: "/images/game/zijin-cloud.jpg", x: 0.74, y: 0.5 },
    ],
  },
  {
    id: "qinhuai",
    title: "秦淮河 · 夜灯漫游",
    subtitle: "请为今晚留下一点灯光。",
    sceneMood: "靛蓝、暖金、河灯、花窗",
    intro: "将灯光碎片安放到夜色里。",
    letter: "今晚的光，替你留着。",
    stamp: "夜灯漫游",
    interaction: "light",
    gestureHint: "先点亮河面，再收进留白",
    palette: {
      bg: "#29384f",
      ink: "#f1e8d6",
      accent: "#c8a56a",
      soft: "#52627a",
    },
    fragments: [
      { id: "qinhuai-lantern", routeId: "qinhuai", name: "河灯", symbol: "✦", slotId: "qinhuai-slot-1", hint: "先点亮这盏灯", lore: "灯只为今晚留着。", image: "/images/game/qinhuai-lantern.jpg", x: 0.28, y: 0.58 },
      { id: "qinhuai-window", routeId: "qinhuai", name: "花窗", symbol: "◇", slotId: "qinhuai-slot-2", hint: "点亮窗格", lore: "花窗把夜切成暖金。", image: "/images/game/qinhuai-window.jpg", x: 0.55, y: 0.36 },
      { id: "qinhuai-bridge", routeId: "qinhuai", name: "桥影", symbol: "⌒", slotId: "qinhuai-slot-3", hint: "点亮桥下的水", lore: "桥影比人更早到岸。", image: "/images/game/qinhuai-bridge.jpg", x: 0.78, y: 0.64 },
    ],
  },
];

export const TOTAL_FRAGMENT_COUNT = GAME_ROUTES.reduce(
  (total, route) => total + route.fragments.length,
  0,
);

export function getRouteDefinition(routeId: RouteId) {
  return GAME_ROUTES.find((route) => route.id === routeId) ?? GAME_ROUTES[0];
}

export function createDefaultRouteProgress(routeId: RouteId): RouteProgress {
  const route = getRouteDefinition(routeId);

  return {
    routeId,
    fragments: route.fragments.map((fragment) => ({
      id: fragment.id,
      found: false,
      placed: false,
    })),
    completed: false,
  };
}

export function createDefaultGameProgress(): GameProgress {
  const routes = ROUTE_ORDER.reduce(
    (acc, routeId) => {
      acc[routeId] = createDefaultRouteProgress(routeId);
      return acc;
    },
    {} as Record<RouteId, RouteProgress>,
  );

  return {
    routes,
    activeRouteId: null,
    soundEnabled: false,
    lastUpdatedAt: new Date().toISOString(),
  };
}
