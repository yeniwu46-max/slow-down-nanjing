import type { MapPoi } from "@/lib/map/types";
import {
  getKnowledgeEntity,
  getPoiCultureSummary,
  getPoiKnowledgeEntityIds,
  resolveCultureEntityIds,
} from "@/lib/culture/graph";
import type {
  PoiSemanticMatch,
  SemanticConstraintPatch,
} from "./types";

const CULTURE_ALIASES: Record<string, string[]> = {
  "六朝文化": ["六朝", "建康", "台城"],
  "民国文化": ["民国", "近代", "公馆"],
  "明代文化": ["明代", "明朝", "明城墙", "城门"],
  "秦淮文化": ["秦淮", "夫子庙", "科举", "老城南"],
  "佛教文化": ["佛教", "寺庙", "古刹", "禅意"],
  "金陵山水": ["金陵山水", "湖景", "山水", "园林"],
};

const LOW_ENERGY_WORDS = ["少走", "不累", "轻松", "低体力", "腿脚", "慢一点", "休息"];
const RAIN_WORDS = ["雨天", "下雨", "避雨", "雨棚"];
const INDOOR_WORDS = ["室内", "场馆", "博物馆", "有遮蔽"];
const ACCESSIBLE_WORDS = ["无障碍", "轮椅", "老人", "婴儿车"];
const QUIET_WORDS = ["避开拥挤", "不排队", "人少", "安静"];
const NIGHT_WORDS = ["夜游", "夜景", "傍晚", "晚上"];

function containsAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

export function clampPreferenceText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 120);
}

export function inferSemanticConstraints(query: string): SemanticConstraintPatch {
  const text = clampPreferenceText(query);
  const cultureFocusTags = Object.entries(CULTURE_ALIASES)
    .filter(([, aliases]) => containsAny(text, aliases))
    .map(([tag]) => tag);
  const patch: SemanticConstraintPatch = {};

  if (containsAny(text, LOW_ENERGY_WORDS) || containsAny(text, ACCESSIBLE_WORDS)) {
    patch.walkingAbility = "relaxed";
  }
  if (containsAny(text, RAIN_WORDS)) patch.weatherCondition = "rainy";
  if (containsAny(text, QUIET_WORDS)) patch.avoidCrowds = true;
  if (containsAny(text, NIGHT_WORDS)) patch.nightMode = true;
  if (cultureFocusTags.length) {
    patch.preference = "culture";
    patch.cultureFocusTags = cultureFocusTags;
    patch.cultureFocusEntityIds = resolveCultureEntityIds(cultureFocusTags);
  }
  return patch;
}

export function buildPoiSemanticDocument(poi: MapPoi): string {
  const venue = poi.venueType === "indoor" ? "室内场馆" : poi.venueType === "mixed" ? "室内外结合" : "户外景点";
  return [
    poi.name,
    poi.category,
    poi.description ?? "",
    poi.cultureTags.join("、"),
    getPoiCultureSummary(poi.id),
    venue,
    `体力消耗${poi.energyLevel}级`,
    `雨天适宜度${poi.rainyDaySuitability}级`,
    poi.restFacilities.length ? `休息设施：${poi.restFacilities.join("、")}` : "休息设施有限",
    `无障碍情况：${poi.accessibility}`,
  ].join("；");
}

function matchedCultureTags(query: string, poi: MapPoi): string[] {
  return poi.cultureTags.filter((tag) => {
    const aliases = CULTURE_ALIASES[tag] ?? [tag];
    return query.includes(tag) || containsAny(query, aliases);
  });
}

function matchedKnowledgeEntities(query: string, poi: MapPoi, tags: string[]): string[] {
  const tagEntities = resolveCultureEntityIds(tags);
  const poiEntities = getPoiKnowledgeEntityIds(poi.id);
  return [...new Set([...tagEntities, ...poiEntities.filter((id) => {
    const entity = getKnowledgeEntity(id);
    return entity ? [entity.label, ...(entity.aliases ?? [])].some((term) => query.includes(term)) : false;
  })])].sort();
}

function lexicalOverlap(query: string, document: string): number {
  const chars = [...new Set(query.replace(/[\s，。、“”！？；：]/g, ""))];
  if (!chars.length) return 0;
  return chars.filter((char) => document.includes(char)).length / chars.length;
}

function relativeScores(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-8) return values.map(() => 50);
  return values.map((value) => Math.round(((value - min) / (max - min)) * 100));
}

function explainMatch(query: string, poi: MapPoi, tags: string[]): string[] {
  const reasons: string[] = [];
  const entityLabels = matchedKnowledgeEntities(query, poi, tags)
    .map((id) => getKnowledgeEntity(id)?.label)
    .filter((label): label is string => Boolean(label));
  if (entityLabels.length) reasons.push(`图谱匹配：${entityLabels.slice(0, 3).join("、")}`);
  else if (tags.length) reasons.push(`文化主题：${tags.join("、")}`);
  if (containsAny(query, [...RAIN_WORDS, ...INDOOR_WORDS]) && poi.rainyDaySuitability >= 4) {
    reasons.push(`${poi.venueType === "indoor" ? "室内" : "半室内"}且雨天适宜度高`);
  }
  if (containsAny(query, LOW_ENERGY_WORDS) && poi.energyLevel <= 2) {
    reasons.push(`体力消耗${poi.energyLevel}级`);
  }
  if (containsAny(query, ACCESSIBLE_WORDS) && /无障碍|可通行|平整|电梯|坡道/.test(poi.accessibility)) {
    reasons.push("无障碍条件较友好");
  }
  if (query.includes("休息") && poi.restFacilities.length) {
    reasons.push(`可使用${poi.restFacilities.slice(0, 2).join("、")}`);
  }
  if (!reasons.length) reasons.push(`与“${poi.description ?? poi.category}”语义相关`);
  return reasons.slice(0, 3);
}

export function rankPoisByKeyword(query: string, pois: MapPoi[]): PoiSemanticMatch[] {
  const text = clampPreferenceText(query);
  if (!text) return [];
  const raw = pois.map((poi) => {
    const document = buildPoiSemanticDocument(poi);
    const tags = matchedCultureTags(text, poi);
    let score = lexicalOverlap(text, document) * 30 + tags.length * 24;
    if (containsAny(text, [...RAIN_WORDS, ...INDOOR_WORDS])) {
      score += poi.rainyDaySuitability * 5 + (poi.venueType === "indoor" ? 16 : poi.venueType === "mixed" ? 8 : 0);
    }
    if (containsAny(text, LOW_ENERGY_WORDS)) {
      score += (6 - poi.energyLevel) * 5 + Math.min(8, poi.restFacilities.length * 2);
    }
    if (containsAny(text, ACCESSIBLE_WORDS) && /无障碍|可通行|平整|电梯|坡道/.test(poi.accessibility)) {
      score += 18;
    }
    if (containsAny(text, NIGHT_WORDS) && poi.operatingHours.closesAtMinutes >= 20 * 60) score += 10;
    return { poi, rawScore: score, tags };
  });
  const scores = relativeScores(raw.map((item) => item.rawScore));
  return raw
    .map((item, index) => ({
      poiId: item.poi.id,
      score: scores[index],
      matchedTags: item.tags,
      matchedKnowledgeEntityIds: matchedKnowledgeEntities(text, item.poi, item.tags),
      reasons: explainMatch(text, item.poi, item.tags),
    }))
    .sort((a, b) => b.score - a.score || a.poiId.localeCompare(b.poiId));
}

export function rankPoisByEmbedding(
  query: string,
  queryVector: number[],
  poiVectors: Record<string, number[]>,
  pois: MapPoi[],
): PoiSemanticMatch[] {
  const raw = pois.map((poi) => {
    const vector = poiVectors[poi.id];
    const similarity = vector
      ? vector.reduce((sum, value, index) => sum + value * (queryVector[index] ?? 0), 0)
      : -1;
    const tags = matchedCultureTags(query, poi);
    return { poi, similarity, tags };
  });
  const scores = relativeScores(raw.map((item) => item.similarity));
  return raw
    .map((item, index) => ({
      poiId: item.poi.id,
      score: scores[index],
      rawSimilarity: Number(item.similarity.toFixed(6)),
      matchedTags: item.tags,
      matchedKnowledgeEntityIds: matchedKnowledgeEntities(query, item.poi, item.tags),
      reasons: explainMatch(query, item.poi, item.tags),
    }))
    .sort((a, b) => b.score - a.score || a.poiId.localeCompare(b.poiId));
}
