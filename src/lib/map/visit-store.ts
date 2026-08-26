"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyPoiStates, MAP_POIS } from "@/lib/map/pois";
import type { MapPoi, PoiState } from "@/lib/map/types";

interface VisitStore {
  states: Record<string, PoiState>;
  setPoiState: (id: string, state: PoiState) => void;
  clearPoiState: (id: string) => void;
  pois: () => MapPoi[];
}

export const useVisitStore = create<VisitStore>()(
  persist(
    (set, get) => ({
      states: {},
      setPoiState: (id, state) =>
        set((s) => ({ states: { ...s.states, [id]: state } })),
      clearPoiState: (id) =>
        set((s) => {
          const next = { ...s.states };
          delete next[id];
          return { states: next };
        }),
      pois: () => applyPoiStates(get().states, MAP_POIS),
    }),
    { name: "slow-down-map-visits" },
  ),
);
