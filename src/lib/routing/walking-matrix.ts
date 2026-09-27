import matrixJson from "@/data/nanjing-walking-matrix.json";
import { MAP_POIS } from "@/lib/map/pois";

export interface WalkingMatrixData {
  schemaVersion: number;
  generatedAt: string;
  sourceHash: string;
  provider: string;
  providerVersion: string | null;
  algorithm: string;
  costing: "pedestrian";
  units: string;
  sourceDataset: string;
  attribution: string;
  buildEndpoint: string;
  tilesetLastModified: number | null;
  locationIds: string[];
  locations: Array<{ id: string; lat: number; lon: number }>;
  durationsSeconds: number[][];
  distancesKm: number[][];
  unreachablePairs: string[];
}
export interface WalkingMatrixLeg {
  fromId: string;
  toId: string;
  durationSeconds: number;
  walkingMinutes: number;
  distanceKm: number;
  source: "valhalla-osm";
}

export const WALKING_MATRIX = matrixJson as WalkingMatrixData;
const INDEX = new Map(WALKING_MATRIX.locationIds.map((id, index) => [id, index]));

export function getWalkingMatrixLeg(fromId: string, toId: string): WalkingMatrixLeg | null {
  const from = INDEX.get(fromId);
  const to = INDEX.get(toId);
  if (from == null || to == null) return null;
  const durationSeconds = WALKING_MATRIX.durationsSeconds[from]?.[to];
  const distanceKm = WALKING_MATRIX.distancesKm[from]?.[to];
  if (!Number.isFinite(durationSeconds) || !Number.isFinite(distanceKm)) return null;
  return {
    fromId,
    toId,
    durationSeconds,
    walkingMinutes: Math.max(0, Math.ceil(durationSeconds / 60)),
    distanceKm,
    source: "valhalla-osm",
  };
}

export function walkingTimeMatrixMinutes(poiIds: string[], walkingFactor = 1): number[][] {
  return poiIds.map((fromId) => poiIds.map((toId) => {
    const leg = getWalkingMatrixLeg(fromId, toId);
    if (!leg) throw new Error(`Walking matrix is missing ${fromId}>${toId}`);
    return Math.max(0, Math.ceil(leg.durationSeconds * walkingFactor / 60));
  }));
}

export function walkingDistanceMatrixKm(poiIds: string[]): number[][] {
  return poiIds.map((fromId) => poiIds.map((toId) => {
    const leg = getWalkingMatrixLeg(fromId, toId);
    if (!leg) throw new Error(`Walking matrix is missing ${fromId}>${toId}`);
    return leg.distanceKm;
  }));
}

export function validateWalkingMatrix(): string[] {
  const errors: string[] = [];
  const poiIds = MAP_POIS.map((poi) => poi.id);
  if (WALKING_MATRIX.costing !== "pedestrian") errors.push("costing 必须为 pedestrian");
  if (WALKING_MATRIX.locationIds.length !== poiIds.length) errors.push("矩阵地点数量与 POI 不一致");
  if (WALKING_MATRIX.locationIds.join("|") !== poiIds.join("|")) errors.push("矩阵地点顺序与 POI 不一致");
  if (WALKING_MATRIX.unreachablePairs.length) errors.push("矩阵包含不可达地点对");
  for (let index = 0; index < poiIds.length; index++) {
    if (WALKING_MATRIX.durationsSeconds[index]?.length !== poiIds.length) errors.push(`时长矩阵第 ${index} 行长度错误`);
    if (WALKING_MATRIX.distancesKm[index]?.length !== poiIds.length) errors.push(`距离矩阵第 ${index} 行长度错误`);
    if (WALKING_MATRIX.durationsSeconds[index]?.[index] !== 0) errors.push(`时长矩阵 ${poiIds[index]} 对角线不为 0`);
    if (WALKING_MATRIX.distancesKm[index]?.[index] !== 0) errors.push(`距离矩阵 ${poiIds[index]} 对角线不为 0`);
  }
  return errors;
}
