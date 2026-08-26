export interface DailyWalkRecord {
  day: number;
  date: string;
  steps: number;
  km: number;
  routeName: string;
  stayLocations: string[];
  photos: string[];
  mood: { name: string; icon: string };
  diary: string;
  heatLevel: number;
}

export const JUNE_RECORDS: DailyWalkRecord[] = [
  {
    day: 9,
    date: "2026-06-09",
    steps: 8420,
    km: 3.8,
    routeName: "\u68A7\u6850\u6162\u884C\u9053",
    stayLocations: ["\u7384\u6B66\u6E56", "\u9E21\u9E23\u5BFA"],
    photos: ["/images/hero-scene.jpg"],
    mood: { name: "\u5E73\u9759", icon: "\uD83C\uDF3F" },
    diary:
      "\u6CBF\u7740\u6E56\u8FB9\u6162\u6162\u5730\u8D70\uFF0C\u5FAE\u98CE\u62A1\u8FC7\u6C34\u9762\uFF0C\u65F6\u95F4\u597D\u50CF\u4E5F\u6162\u4E86\u4E0B\u6765\u3002",
    heatLevel: 4,
  },
  {
    day: 14,
    date: "2026-06-14",
    steps: 10200,
    km: 4.2,
    routeName: "\u9889\u548C\u8DEF\u5DF7\u5F04",
    stayLocations: ["\u9889\u548C\u8DEF", "\u5148\u950B\u4E66\u5E97"],
    photos: ["/images/hero-scene.jpg", "/images/login-bg.jpg"],
    mood: { name: "\u6109\u60A6", icon: "\uD83C\uDF1E" },
    diary:
      "\u5348\u540E\u7684\u9633\u5149\u5F88\u597D\uFF0C\u8D70\u8FC7\u6850\u6811\u63A9\u6620\u7684\u8857\u5DF7\uFF0C\u8001\u623F\u5B50\u5B89\u9759\u5730\u7ACB\u5728\u90A3\u91CC\u3002",
    heatLevel: 4,
  },
  {
    day: 18,
    date: "2026-06-18",
    steps: 6800,
    km: 2.9,
    routeName: "\u8001\u95E8\u4E1C\u6F2B\u6B65",
    stayLocations: ["\u8001\u95E8\u4E1C", "\u592B\u5B50\u5E99"],
    photos: ["/images/login-bg.jpg"],
    mood: { name: "\u611F\u52A8", icon: "\u2728" },
    diary:
      "\u5728\u767E\u5E74\u68A7\u6850\u4E0B\u6162\u6162\u8D70\uFF0C\u8BA9\u6811\u5F71\u843D\u5728\u80A9\u4E0A\uFF0C\u4F60\u4F1A\u770B\u89C1\u57CE\u5E02\u6E29\u67D4\u7684\u4E00\u9762\u3002",
    heatLevel: 3,
  },
  {
    day: 20,
    date: "2026-06-20",
    steps: 7600,
    km: 3.2,
    routeName: "\u7384\u6B66\u6E56\u73AF\u7EBF",
    stayLocations: ["\u7384\u6B66\u6E56", "\u57CE\u5899\u6839"],
    photos: ["/images/hero-scene.jpg"],
    mood: { name: "\u5E73\u9759", icon: "\uD83C\uDF3F" },
    diary: "\u57CE\u5899\u7684\u5F71\u5B50\u843D\u5728\u6E56\u91CC\uFF0C\u50CF\u4E00\u6BB5\u88AB\u653E\u6162\u7684\u65E7\u65F6\u5149\u3002",
    heatLevel: 3,
  },
  {
    day: 26,
    date: "2026-06-26",
    steps: 9100,
    km: 3.6,
    routeName: "\u4E2D\u5C71\u9675\u6797\u836B\u9053",
    stayLocations: ["\u4E2D\u5C71\u9675", "\u97F3\u4E50\u53F0"],
    photos: ["/images/login-bg.jpg"],
    mood: { name: "\u6109\u60A6", icon: "\uD83C\uDF1E" },
    diary:
      "\u53F0\u9636\u4E0D\u591A\uFF0C\u5FC3\u5374\u8D70\u5F97\u5F88\u8FDC\uFF0C\u6797\u95F4\u7684\u98CE\u628A\u70E6\u5FE7\u90FD\u5439\u6563\u4E86\u3002",
    heatLevel: 4,
  },
  {
    day: 27,
    date: "2026-06-27",
    steps: 7200,
    km: 3.1,
    routeName: "\u83AB\u6101\u6E56\u6668\u884C",
    stayLocations: ["\u83AB\u6101\u6E56", "\u5357\u4EAC\u5927\u5B66"],
    photos: ["/images/hero-scene.jpg"],
    mood: { name: "\u5E73\u9759", icon: "\uD83C\uDF3F" },
    diary:
      "\u6E05\u6668\u7684\u6E56\u9762\u5F88\u5B89\u9759\uFF0C\u6CBF\u6E56\u6162\u6162\u8D70\uFF0C\u611F\u89C9\u6574\u4E2A\u4EBA\u90FD\u8F7B\u4E86\u4E0B\u6765\u3002",
    heatLevel: 3,
  },
];

/** @deprecated Use JUNE_RECORDS */
export const JUNE_2024_RECORDS = JUNE_RECORDS;

export const ROUTE_ALBUM = [
  { id: "wutong-walk", name: "\u68A7\u6850\u6162\u884C\u9053", km: 6.2, days: 3 },
  { id: "xuanwu-loop", name: "\u7384\u6B66\u6E56\u73AF\u7EBF", km: 4.8, days: 2 },
  { id: "yihe-alley", name: "\u9889\u548C\u8DEF\u5DF7\u5F04", km: 3.5, days: 2 },
  { id: "laomendong", name: "\u8001\u95E8\u4E1C\u6F2B\u6B65", km: 2.9, days: 1 },
  { id: "zhongshan", name: "\u4E2D\u5C71\u9675\u6797\u836B\u9053", km: 5.1, days: 2 },
  { id: "fuzimiao", name: "\u592B\u5B50\u5E99\u591C\u6E38", km: 2.4, days: 1 },
  { id: "ming-wall", name: "\u660E\u57CE\u5899\u6BB5", km: 3.8, days: 1 },
  { id: "qixia", name: "\u6816\u971E\u5C71\u521D\u63A2", km: 7.2, days: 1 },
  { id: "jiangxin", name: "\u6C5F\u5FC3\u6D32\u9A91\u884C", km: 8.5, days: 1 },
  { id: "xianlin", name: "\u4ED9\u6797\u6E56\u7EFF\u9053", km: 4.6, days: 1 },
  { id: "mochou", name: "\u83AB\u6101\u6E56\u6668\u884C", km: 3.1, days: 1 },
  { id: "chaotian", name: "\u671D\u5929\u5BAB\u6587\u5316\u7EBF", km: 2.7, days: 1 },
];

export function recordForDay(day: number): DailyWalkRecord | undefined {
  return JUNE_RECORDS.find((r) => r.day === day);
}

export function heatForDay(day: number): number {
  const record = recordForDay(day);
  if (record) return record.heatLevel;
  const HEAT = [
    0, 1, 2, 1, 3, 0, 2, 1, 4, 2, 3, 1, 2, 0, 2, 3, 4, 2, 1, 3, 1, 0, 2, 3, 1, 4, 2, 1, 1, 2, 0, 3,
    1, 2, 0,
  ];
  return HEAT[day - 1] ?? 0;
}
