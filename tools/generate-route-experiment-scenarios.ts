import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { RouteExperimentScenario } from "../src/lib/experiments/route-experiment";

const OUTPUT_DIR = path.resolve("experiments/route-planning");

const templates = [
  {
    id: "six-dynasties",
    name: "六朝古都",
    poiIds: ["jiming-temple", "taicheng", "xuanwu-lake", "xuanwu-lake-pavilion", "presidential-palace"],
    query: "想看六朝遗迹和古都城墙，按文脉慢慢走",
  },
  {
    id: "republican",
    name: "民国建筑",
    poiIds: ["yihe-road", "wutong-avenue", "presidential-palace", "1912", "yijiu-cafe"],
    query: "想看民国建筑、梧桐街区和城市近代记忆",
  },
  {
    id: "qinhuai",
    name: "秦淮城南",
    poiIds: ["confucius-temple", "laomendong", "zhonghua-gate", "dabaosi", "chaotian-palace"],
    query: "想沿秦淮河了解科举、老城南和市井生活",
  },
  {
    id: "ming-wall",
    name: "明城墙",
    poiIds: ["zhonghua-gate", "taicheng", "dabaosi", "chaotian-palace", "laomendong"],
    query: "想理解明城墙和南京都城防御体系",
  },
  {
    id: "zhongshan",
    name: "钟山风景",
    poiIds: ["zhongshan", "sun-yat-sen", "ming-xiaoling", "meihua-hill", "wutong-avenue"],
    query: "想走钟山民国纪念路线，也看看山林风景",
  },
  {
    id: "museum",
    name: "博物馆城市史",
    poiIds: ["nanjing-museum", "presidential-palace", "chaotian-palace", "pioneer-bookstore", "1912"],
    query: "想在博物馆和历史建筑中了解南京城市变迁",
  },
  {
    id: "buddhist",
    name: "佛教文化",
    poiIds: ["jiming-temple", "qixia", "dabaosi", "taicheng", "xuanwu-lake"],
    query: "想参访南京佛教古迹，环境安静一些",
  },
  {
    id: "lake",
    name: "湖泊慢游",
    poiIds: ["xuanwu-lake", "xuanwu-lake-pavilion", "mochou-lake", "yihe-road", "pioneer-bookstore"],
    query: "想看湖景和园林，路线轻松并有休息处",
  },
  {
    id: "low-energy",
    name: "低体力街区",
    poiIds: ["1912", "presidential-palace", "yijiu-cafe", "yihe-road", "wutong-avenue"],
    query: "不想走太累，想逛民国街区并找地方休息",
  },
  {
    id: "accessible",
    name: "无障碍友好",
    poiIds: ["nanjing-museum", "presidential-palace", "1912", "xuanwu-lake", "pioneer-bookstore"],
    query: "带老人出行，希望无障碍、室内多、少走路",
  },
  {
    id: "night",
    name: "城市夜游",
    poiIds: ["1912", "confucius-temple", "laomendong", "yijiu-cafe", "xuanwu-lake"],
    query: "周末傍晚想夜游，避开拥挤并看城市灯景",
  },
  {
    id: "cross-city",
    name: "综合跨区",
    poiIds: ["qixia", "zhongshan", "nanjing-museum", "presidential-palace", "confucius-temple"],
    query: "时间有限，想从山林到老城看南京历史层次",
  },
] as const;

const profiles = [
  {
    id: "rain-short" as const,
    name: "雨天低体力短时",
    budgetMinutes: 60,
    departureTimeMinutes: 14 * 60,
    walkingAbility: "relaxed" as const,
    weatherCondition: "rainy" as const,
    preference: "efficiency" as const,
    avoidCrowds: false,
    nightMode: false,
  },
  {
    id: "morning-wait" as const,
    name: "早晨等候开馆",
    budgetMinutes: 150,
    departureTimeMinutes: 8 * 60,
    walkingAbility: "balanced" as const,
    weatherCondition: "cloudy" as const,
    preference: "efficiency" as const,
    avoidCrowds: false,
    nightMode: false,
  },
  {
    id: "closing-pressure" as const,
    name: "下午临近闭馆",
    budgetMinutes: 90,
    departureTimeMinutes: 16 * 60 + 10,
    walkingAbility: "balanced" as const,
    weatherCondition: "cloudy" as const,
    preference: "culture" as const,
    avoidCrowds: false,
    nightMode: false,
  },
  {
    id: "culture-day" as const,
    name: "日间文化偏好",
    budgetMinutes: 180,
    departureTimeMinutes: 10 * 60,
    walkingAbility: "balanced" as const,
    weatherCondition: "sunny" as const,
    preference: "culture" as const,
    avoidCrowds: false,
    nightMode: false,
  },
  {
    id: "weekend-night" as const,
    name: "周末傍晚避拥挤",
    budgetMinutes: 150,
    departureTimeMinutes: 17 * 60 + 30,
    walkingAbility: "active" as const,
    weatherCondition: "cloudy" as const,
    preference: "scenery" as const,
    avoidCrowds: true,
    nightMode: true,
  },
] as const;

const deliberatelyInfeasible = new Set(["museum", "buddhist", "accessible", "cross-city"]);

const scenarios: RouteExperimentScenario[] = [];
let ordinal = 1;
for (const template of templates) {
  for (const profile of profiles) {
    const isNegativeControl = profile.id === "closing-pressure" && deliberatelyInfeasible.has(template.id);
    scenarios.push({
      id: `${String(ordinal).padStart(2, "0")}-${template.id}-${profile.id}`,
      ordinal,
      templateId: template.id,
      templateName: template.name,
      profileId: profile.id,
      profileName: profile.name,
      candidatePoiIds: [...template.poiIds],
      startPoiId: profile.id === "morning-wait" ? template.poiIds[0] : null,
      budgetMinutes: profile.id === "rain-short" && ordinal % 2 === 1 ? 45 : profile.budgetMinutes,
      departureTimeMinutes: profile.departureTimeMinutes,
      walkingAbility: profile.walkingAbility,
      weatherCondition: profile.weatherCondition,
      preference: profile.preference,
      closedPoiIds: isNegativeControl
        ? [...template.poiIds]
        : profile.id === "closing-pressure"
          ? [template.poiIds[template.poiIds.length - 1]]
          : [],
      avoidCrowds: profile.avoidCrowds,
      nightMode: profile.nightMode,
      query: template.query,
      expectedFeasible: !isNegativeControl,
    });
    ordinal += 1;
  }
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUTPUT_DIR, "scenarios.json"),
    `${JSON.stringify({ schemaVersion: 1, seed: 20260928, scenarios }, null, 2)}\n`,
    "utf8",
  );
  console.log(`Wrote ${scenarios.length} fixed scenarios to ${path.join(OUTPUT_DIR, "scenarios.json")}`);
}

void main();
