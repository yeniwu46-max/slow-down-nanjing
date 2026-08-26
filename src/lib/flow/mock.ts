export interface SliderConfig {
  id: string;
  label: string;
  icon: "cloud" | "sun" | "users" | "footprints";
  defaultValue: number;
  getDescription: (value: number) => string;
}

export const SLIDER_CONFIGS: SliderConfig[] = [
  {
    id: "pressure",
    label: "\u4eca\u5929\u538b\u529b",
    icon: "cloud",
    defaultValue: 72,
    getDescription: (v) =>
      v >= 60 ? "\u538b\u529b\u8f83\u5927" : v >= 40 ? "\u538b\u529b\u9002\u4e2d" : "\u538b\u529b\u8f83\u5c0f",
  },
  {
    id: "energy",
    label: "\u7cbe\u529b\u503c",
    icon: "sun",
    defaultValue: 58,
    getDescription: (v) =>
      v >= 60 ? "\u7cbe\u529b\u5145\u6c9b" : v >= 40 ? "\u7cbe\u529b\u4e2d\u7b49" : "\u7cbe\u529b\u504f\u4f4e",
  },
  {
    id: "social",
    label: "\u793e\u4ea4\u6b32\u671b",
    icon: "users",
    defaultValue: 38,
    getDescription: (v) =>
      v >= 60 ? "\u5f88\u60f3\u4ea4\u6d41" : v >= 40 ? "\u9002\u5ea6\u793e\u4ea4" : "\u66f4\u60f3\u72ec\u5904",
  },
  {
    id: "exercise",
    label: "\u8fd0\u52a8\u610f\u613f",
    icon: "footprints",
    defaultValue: 81,
    getDescription: (v) =>
      v >= 60 ? "\u5f88\u60f3\u6d3b\u52a8" : v >= 40 ? "\u9002\u5ea6\u8d70\u8d70" : "\u66f4\u60f3\u4f11\u606f",
  },
];

export const ANALYSIS_STEPS = [
  {
    icon: "leaf" as const,
    title: "正在读你写下的心情…",
    subtitle: "把匆忙先放一放，听听今天想走多慢",
  },
  {
    icon: "audio" as const,
    title: "正在对照金陵风物…",
    subtitle: "梧桐、玄武湖、秦淮，哪一条更贴近此刻",
  },
  {
    icon: "image" as const,
    title: "正在铺一条慢路…",
    subtitle: "不赶点，只把风景排进脚步里",
  },
  {
    icon: "route" as const,
    title: "今日金陵路已备好",
    subtitle: "适合你的路，不一定最快，但一定舒服",
  },
];

export interface MockRouteDisplay {
  id: string;
  name: string;
  nameEn: string;
  rating: number;
  duration: string;
  distance: string;
  tagline: string;
  description: string[];
  highlights: { title: string; description: string }[];
}

export const MOCK_ROUTE_WUTONG: MockRouteDisplay = {
  id: "wutong-walk",
  name: "\u68a7\u6850\u6162\u884c",
  nameEn: "Slow Walk",
  rating: 5,
  duration: "90 min",
  distance: "\u7ea6 6.2 km",
  tagline: "\u9002\u5408\u653e\u677e\u3001\u653e\u7a7a\u3001\u611f\u53d7\u81ea\u7136\u4e0e\u4eba\u6587",
  description: [
    "\u5728\u767e\u5e74\u68a7\u6850\u4e0b\u6162\u6162\u8d70\uff0c",
    "\u8ba9\u6811\u5f71\u843d\u5728\u80a9\u4e0a\uff0c",
    "\u4f60\u4f1a\u770b\u89c1\u57ce\u5e02\u6e29\u67d4\u7684\u4e00\u9762\u3002",
  ],
  highlights: [
    {
      title: "\u68a7\u6850\u5927\u9053",
      description: "\u767e\u5e74\u68a7\u6850\uff0c\u5149\u5f71\u6591\u9a73\uff0c\u9002\u5408\u6162\u884c\u4e0e\u62cd\u7167",
    },
    {
      title: "\u7384\u6b66\u6e56\u7554",
      description: "\u6e56\u5149\u7027\u6fa7\uff0c\u5fae\u98ce\u62c1\u9762\uff0c\u9002\u5408\u653e\u7a7a\u4e0e\u4f11\u606f",
    },
    {
      title: "\u4eba\u6587\u53e4\u8ff9",
      description: "\u4e2d\u5c71\u9675\u3001\u660e\u5b5d\u9675\uff0c\u611f\u53d7\u91d1\u9675\u6df1\u539a\u5e95\u8574",
    },
  ],
};

export const MOCK_ROUTE_YIHE: MockRouteDisplay = {
  id: "yihe-alley-walk",
  name: "颐和路巷弄",
  nameEn: "Alley Stroll",
  rating: 4,
  duration: "75 min",
  distance: "\u7ea6 4.8 km",
  tagline: "\u9002\u5408\u6000\u65e7\u3001\u72ec\u5904\u3001\u611f\u53d7\u6c11\u56fd\u6c14\u606f",
  description: [
    "\u6811\u5f71\u73ed\u9a73\u7684\u6811\u6811\u9053\u4e0a\uff0c",
    "\u8001\u522b\u5885\u9759\u9759\u7acb\u7740\uff0c",
    "\u6bcf\u4e00\u6247\u95e8\u90fd\u662f\u4e00\u6bb5\u65f6\u5149\u7684\u6545\u4e8b\u3002",
  ],
  highlights: [
    {
      title: "\u9889\u548c\u8def\u6811\u6811\u9053",
      description: "\u6cd5\u56fd\u6817\u6811\u4e24\u6392\uff0c\u6625\u590f\u7eff\u610f\u76c8\u7136\uff0c\u6781\u5177\u7535\u5f71\u611f",
    },
    {
      title: "\u5148\u950b\u4e66\u5e97",
      description: "\u72ec\u7acb\u4e66\u5e97\u4e0e\u5496\u5561\u9999\uff0c\u9002\u5408\u505c\u4e0b\u6765\u9605\u8bfb\u4e00\u4f1a\u513f",
    },
    {
      title: "\u6c11\u56fd\u522b\u5885",
      description: "\u9752\u7816\u7070\u74e6\u4e0e\u94c1\u827a\u680f\u6746\uff0c\u611f\u53d7\u91d1\u9675\u65f6\u671f\u7684\u6587\u5316\u6c1b\u56f4",
    },
  ],
};

export const MOCK_ROUTE_XUANWU: MockRouteDisplay = {
  id: "xuanwu-loop",
  name: "玄武湖环线",
  nameEn: "Lake Loop",
  rating: 5,
  duration: "80 min",
  distance: "约 5.4 km",
  tagline: "适合放空、吹风、把脚步交给湖岸",
  description: [
    "湖在右边，城墙在左边，",
    "不必走完一圈，",
    "停下来看水，也算到过。",
  ],
  highlights: [
    {
      title: "鸡鸣寺",
      description: "古刹樱影，把城市的声音先挡在山门外",
    },
    {
      title: "台城",
      description: "墙头看湖，风比日程更先到",
    },
    {
      title: "玄武湖梁洲",
      description: "洲上走一走，把着急留在岸上",
    },
  ],
};

export const MOCK_ROUTE_QINHUAI: MockRouteDisplay = {
  id: "qinhuai-night",
  name: "秦淮灯影",
  nameEn: "Lantern Walk",
  rating: 5,
  duration: "95 min",
  distance: "约 6.8 km",
  tagline: "适合夜色、灯火、把一天慢慢收尾",
  description: [
    "河风先到，灯再亮起来，",
    "城南这一条线不赶场，",
    "只把今晚留给脚步。",
  ],
  highlights: [
    {
      title: "夫子庙",
      description: "秦淮河畔，灯火与书声可以同时存在",
    },
    {
      title: "老门东",
      description: "巷弄里的小店与树影，适合放慢说话",
    },
    {
      title: "中华门",
      description: "瓮城层层，走完再回头看灯",
    },
  ],
};

export const MOCK_ROUTE_PURPLE: MockRouteDisplay = {
  id: "purple-mountain",
  name: "紫金林荫",
  nameEn: "Hill Shade",
  rating: 5,
  duration: "120 min",
  distance: "约 7.6 km",
  tagline: "适合山林、台阶、把呼吸交给松风",
  description: [
    "陵与山把路拉长成台阶，",
    "树荫比阳光先碰到肩膀，",
    "慢一点，山也不会走远。",
  ],
  highlights: [
    {
      title: "梅花山",
      description: "钟山南麓，花开时把日程先放下",
    },
    {
      title: "明孝陵",
      description: "神道石象生，把人送回更早的朝代",
    },
    {
      title: "中山陵",
      description: "台阶是给脚步用的标点",
    },
  ],
};

export const MOCK_ROUTE_WALL: MockRouteDisplay = {
  id: "ming-wall",
  name: "明城墙段",
  nameEn: "City Wall",
  rating: 4,
  duration: "100 min",
  distance: "约 7.1 km",
  tagline: "适合登高、望远、把城市摊开看",
  description: [
    "砖在脚下，树在抬头处，",
    "城墙把南京切成里外两层，",
    "走一段就够，不必走完。",
  ],
  highlights: [
    {
      title: "台城",
      description: "湖与城同时出现，适合停一下",
    },
    {
      title: "鸡鸣寺",
      description: "墙下古刹，把脚步从街上收回来",
    },
    {
      title: "中华门",
      description: "南门瓮城，把这一段墙收到终点",
    },
  ],
};

export const MOCK_ROUTE_QIXIA: MockRouteDisplay = {
  id: "qixia-day",
  name: "栖霞半日",
  nameEn: "Autumn Hill",
  rating: 4,
  duration: "半日",
  distance: "约 25 km",
  tagline: "适合出城、看山、把秋天带回来",
  description: [
    "先把湖和城放在身后，",
    "再把路交给山色，",
    "秋叶最宜，也不必等秋天才去。",
  ],
  highlights: [
    {
      title: "玄武湖",
      description: "出城前先看一眼水",
    },
    {
      title: "南京博物院",
      description: "文脉过一站，再往东走",
    },
    {
      title: "栖霞山",
      description: "红枫与寺，把半天过成一整页",
    },
  ],
};

export const MOCK_ROUTE_YUHUA: MockRouteDisplay = {
  id: "yuhua-quiet",
  name: "雨花台静思",
  nameEn: "Quiet Hill",
  rating: 4,
  duration: "70 min",
  distance: "约 3.8 km",
  tagline: "适合静处、纪念、把话说得更轻",
  description: [
    "城南一坡松，风比人先到，",
    "石与林把城市的声音隔开，",
    "适合把今天慢慢想完。",
  ],
  highlights: [
    {
      title: "中华门",
      description: "从瓮城南望，把脚步带出老城",
    },
    {
      title: "雨花台",
      description: "雨花石与纪念林，城市南端的静思之地",
    },
    {
      title: "松风坡道",
      description: "不必走得很快，停下来也算抵达",
    },
  ],
};

export const MOCK_ROUTE_OPTIONS: MockRouteDisplay[] = [
  MOCK_ROUTE_WUTONG,
  MOCK_ROUTE_YIHE,
  MOCK_ROUTE_XUANWU,
  MOCK_ROUTE_QINHUAI,
  MOCK_ROUTE_PURPLE,
  MOCK_ROUTE_WALL,
  MOCK_ROUTE_QIXIA,
  MOCK_ROUTE_YUHUA,
];

/** @deprecated Use MOCK_ROUTE_WUTONG or pickRandomMockRoute */
export const MOCK_ROUTE = MOCK_ROUTE_WUTONG;

export function pickRandomMockRoute(excludeId?: string): MockRouteDisplay {
  const pool = excludeId
    ? MOCK_ROUTE_OPTIONS.filter((route) => route.id !== excludeId)
    : MOCK_ROUTE_OPTIONS;
  const candidates = pool.length > 0 ? pool : MOCK_ROUTE_OPTIONS;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickNextMockRoute(currentId?: string): MockRouteDisplay {
  if (!currentId) return MOCK_ROUTE_OPTIONS[0];
  const index = MOCK_ROUTE_OPTIONS.findIndex((route) => route.id === currentId);
  return MOCK_ROUTE_OPTIONS[(index + 1) % MOCK_ROUTE_OPTIONS.length];
}

export type MoodIcon = "leaf" | "cup" | "walk" | "ear";

export type MoodAction =
  | { type: "link"; href: string }
  | { type: "agent"; href: string; prompt: string; autoSend: boolean }
  | { type: "nearby" };

export interface MoodOption {
  id: string;
  label: string;
  icon: MoodIcon;
  action: MoodAction;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "tired",
    label: "有点累",
    icon: "leaf",
    action: {
      type: "agent",
      href: "/agents/ningning",
      prompt: "我有点累。给我讲个笑话。",
      autoSend: true,
    },
  },
  {
    id: "quiet",
    label: "想静一静",
    icon: "cup",
    action: { type: "nearby" },
  },
  {
    id: "walk",
    label: "出去走走",
    icon: "walk",
    action: { type: "link", href: "/map" },
  },
  {
    id: "feel",
    label: "感受城市",
    icon: "ear",
    action: { type: "link", href: "/feel-city" },
  },
];
