import type { RouteId } from "@/game/types";
import type { WeatherCondition } from "./types";

export interface WeatherRouteRecommendation {
  routeId: RouteId;
  title: string;
  subtitle: string;
  href: string;
}

const RECOMMENDATIONS: Record<WeatherCondition, WeatherRouteRecommendation> = {
  rainy: {
    routeId: "qinhuai",
    title: "秦淮晚风线",
    subtitle: "雨夜河畔，灯影与晚风正好慢下来",
    href: "/game?route=qinhuai",
  },
  sunny: {
    routeId: "zijin",
    title: "紫金山",
    subtitle: "晴天进山，深呼吸换一口新鲜空气",
    href: "/game?route=zijin",
  },
  cloudy: {
    routeId: "wutong",
    title: "梧桐大道回血线",
    subtitle: "多云不晒，最适合梧桐树影下慢行",
    href: "/game?route=wutong",
  },
  other: {
    routeId: "xuanwu",
    title: "玄武湖放空线",
    subtitle: "天气多变，湖边走走最稳妥",
    href: "/game?route=xuanwu",
  },
};

export function getWeatherRouteRecommendation(
  condition: WeatherCondition,
): WeatherRouteRecommendation {
  return RECOMMENDATIONS[condition];
}

export interface WeatherTip {
  headline: string;
  tips: string[];
  travelAdvice: string;
}

export function getWeatherTips(
  condition: WeatherCondition,
  temperature: number,
): WeatherTip {
  switch (condition) {
    case "rainy":
      return {
        headline: "今天有雨，记得带伞",
        tips: [
          "雨声里的秦淮河别有韵味，河畔慢行记得穿防滑鞋",
          "推荐室内小憩：先锋书店、1912 咖啡街区",
          "若出门，秦淮晚风线的灯影在雨中格外温柔",
        ],
        travelAdvice:
          temperature < 12
            ? "气温偏低，加件薄外套再出门"
            : "适合短途慢行，不宜长时间户外",
      };
    case "sunny":
      return {
        headline: "今天晴朗，适合出门走走",
        tips: [
          "紫金山林间光线正好，适合深呼吸与轻徒步",
          "记得补水防晒，梧桐大道树影下也是好选择",
          "上午与傍晚最舒适， midday 注意遮阳",
        ],
        travelAdvice: "非常适合户外慢游，推荐紫金山或玄武湖",
      };
    case "cloudy":
      return {
        headline: "多云天气，不冷不热",
        tips: [
          "颐和路梧桐大道光影柔和，适合拍照与独行",
          "不晒不热，正是 city walk 的好时候",
          "可以带一本小书，找家咖啡馆坐一会儿",
        ],
        travelAdvice: "温和舒适，适合任意一条慢游路线",
      };
    default:
      return {
        headline: "天气多变，灵活安排",
        tips: [
          "出门前再看一眼实时天气",
          "玄武湖环线几乎不受天气影响",
          "随身带伞，南京的天气说变就变",
        ],
        travelAdvice: "建议就近慢行，随时调整计划",
      };
  }
}
