import localforage from "localforage";
import { createDefaultGameProgress } from "@/game/data/routes";
import type { GameProgress } from "@/game/types";

const STORE_KEY = "jinling-collection-progress";

localforage.config({
  name: "slow-down-game",
  storeName: "jinling_collection",
  description: "金陵风物收纳所本地存档",
});

function mergeWithDefault(progress: GameProgress | null): GameProgress {
  const fallback = createDefaultGameProgress();

  if (!progress) return fallback;

  return {
    ...fallback,
    ...progress,
    routes: {
      ...fallback.routes,
      ...progress.routes,
    },
    soundEnabled: progress.soundEnabled ?? false,
  };
}

export async function loadGameProgress() {
  try {
    const progress = await localforage.getItem<GameProgress>(STORE_KEY);
    return mergeWithDefault(progress);
  } catch {
    return createDefaultGameProgress();
  }
}

export async function saveGameProgress(progress: GameProgress) {
  const nextProgress = {
    ...progress,
    lastUpdatedAt: new Date().toISOString(),
  };

  await localforage.setItem(STORE_KEY, nextProgress);
  return nextProgress;
}

export async function resetGameProgress() {
  const progress = createDefaultGameProgress();
  await localforage.setItem(STORE_KEY, progress);
  return progress;
}
