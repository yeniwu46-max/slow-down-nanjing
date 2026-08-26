"use client";

import { create } from "zustand";
import { GAME_ROUTES, createDefaultGameProgress } from "@/game/data/routes";
import {
  loadGameProgress,
  resetGameProgress,
  saveGameProgress,
} from "@/game/services/persistence";
import type { GameProgress, GameView, RouteId } from "@/game/types";

interface GameStore {
  progress: GameProgress;
  hydrated: boolean;
  view: GameView;
  selectedPosterRouteId: RouteId | null;
  hydrate: () => Promise<void>;
  setView: (view: GameView) => void;
  selectRoute: (routeId: RouteId) => void;
  leaveRoute: () => void;
  markFragmentFound: (routeId: RouteId, fragmentId: string) => void;
  placeFragment: (routeId: RouteId, fragmentId: string, slotId: string) => void;
  unplaceFragment: (routeId: RouteId, fragmentId: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  openPoster: (routeId: RouteId) => void;
  reset: () => Promise<void>;
}

function updateProgress(
  progress: GameProgress,
  updater: (draft: GameProgress) => void,
) {
  const draft: GameProgress = {
    ...progress,
    routes: Object.fromEntries(
      Object.entries(progress.routes).map(([routeId, routeProgress]) => [
        routeId,
        {
          ...routeProgress,
          fragments: routeProgress.fragments.map((fragment) => ({ ...fragment })),
        },
      ]),
    ) as GameProgress["routes"],
    lastUpdatedAt: new Date().toISOString(),
  };

  updater(draft);
  void saveGameProgress(draft);
  return draft;
}

function maybeCompleteRoute(progress: GameProgress, routeId: RouteId) {
  const route = progress.routes[routeId];
  if (!route.completed && route.fragments.every((fragment) => fragment.placed)) {
    route.completed = true;
    route.completedAt = new Date().toISOString();
  }
}

export const useGameStore = create<GameStore>((set) => ({
  progress: createDefaultGameProgress(),
  hydrated: true,
  view: "hub",
  selectedPosterRouteId: null,

  hydrate: async () => {
    set({ hydrated: true });
    try {
      const saved = await loadGameProgress();
      set((state) => ({
        hydrated: true,
        progress: {
          ...saved,
          // URL / 当前选择优先，避免存档回写把刚进入的路线冲回默认玄武湖
          activeRouteId: state.progress.activeRouteId ?? saved.activeRouteId,
        },
      }));
    } catch {
      set((state) => ({
        hydrated: true,
        progress: {
          ...createDefaultGameProgress(),
          activeRouteId: state.progress.activeRouteId,
        },
      }));
    }
  },

  setView: (view) => set({ view }),

  selectRoute: (routeId) =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        draft.activeRouteId = routeId;
      }),
      view: "route",
    })),

  leaveRoute: () =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        draft.activeRouteId = null;
      }),
      view: "hub",
    })),

  markFragmentFound: (routeId, fragmentId) =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        const fragment = draft.routes[routeId].fragments.find((item) => item.id === fragmentId);
        if (fragment) fragment.found = true;
      }),
    })),

  placeFragment: (routeId, fragmentId, slotId) =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        const fragment = draft.routes[routeId].fragments.find((item) => item.id === fragmentId);
        if (!fragment) return;
        fragment.found = true;
        fragment.placed = true;
        fragment.placedSlotId = slotId;
        maybeCompleteRoute(draft, routeId);
      }),
    })),

  unplaceFragment: (routeId, fragmentId) =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        const route = draft.routes[routeId];
        const fragment = route.fragments.find((item) => item.id === fragmentId);
        if (!fragment) return;
        fragment.placed = false;
        fragment.placedSlotId = undefined;
        route.completed = false;
        route.completedAt = undefined;
      }),
    })),

  setSoundEnabled: (enabled) =>
    set((state) => ({
      progress: updateProgress(state.progress, (draft) => {
        draft.soundEnabled = enabled;
      }),
    })),

  openPoster: (routeId) => set({ selectedPosterRouteId: routeId, view: "poster" }),

  reset: async () => {
    const progress = await resetGameProgress();
    set({ progress, view: "hub", selectedPosterRouteId: null });
  },
}));

export function selectCollectedCount(progress: GameProgress) {
  return GAME_ROUTES.reduce(
    (total, route) =>
      total +
      progress.routes[route.id].fragments.filter((fragment) => fragment.placed).length,
    0,
  );
}

export function selectCompletedCount(progress: GameProgress) {
  return GAME_ROUTES.filter((route) => progress.routes[route.id].completed).length;
}

export function useActiveRouteId() {
  return useGameStore((state) => state.progress.activeRouteId ?? GAME_ROUTES[0].id);
}
