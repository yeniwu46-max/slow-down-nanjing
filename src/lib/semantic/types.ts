import type { WeatherCondition } from "@/lib/weather/types";
import type { RoutePreference, WalkingAbility } from "@/lib/map/planning";

export const BGE_MODEL_ID = "bge-small-zh-v1.5";
export const BGE_MODEL_SOURCE = "Xenova/bge-small-zh-v1.5";
export const BGE_MODEL_REVISION = "75c43b069aac4d136ba6bc1122f995fedcfd2781";
export const BGE_QUERY_INSTRUCTION = "为这个句子生成表示以用于检索相关文章：";

export type SemanticProvider = "bge-local" | "keyword-fallback";

export interface SemanticConstraintPatch {
  walkingAbility?: WalkingAbility;
  weatherCondition?: WeatherCondition;
  preference?: RoutePreference;
  cultureFocusTags?: string[];
  cultureFocusEntityIds?: string[];
  avoidCrowds?: boolean;
  nightMode?: boolean;
}

export interface PoiSemanticMatch {
  poiId: string;
  score: number;
  rawSimilarity?: number;
  matchedTags: string[];
  matchedKnowledgeEntityIds: string[];
  reasons: string[];
}

export interface SemanticIntent {
  query: string;
  provider: SemanticProvider;
  modelId: string;
  modelRevision: string;
  inferredPatch: SemanticConstraintPatch;
  matches: PoiSemanticMatch[];
  inferenceMs: number;
  createdAt: string;
}

export type ModelLoadStatus = "idle" | "loading" | "ready" | "fallback" | "error";

export interface ModelLoadState {
  status: ModelLoadStatus;
  progress: number;
  message: string;
}

export type BgeWorkerRequest =
  | { type: "init" }
  | { type: "embed"; requestId: string; text: string };

export type BgeWorkerResponse =
  | { type: "progress"; progress: number; message: string }
  | { type: "ready" }
  | { type: "embedding"; requestId: string; vector: number[]; inferenceMs: number }
  | { type: "error"; requestId?: string; message: string };
