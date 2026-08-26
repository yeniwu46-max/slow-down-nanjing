"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GESTURE_CONFIG } from "@/lib/gesture/config";
import type { ExperienceScene, GestureEvent, GestureId, HandLandmark } from "@/lib/gesture/types";

export interface HandTrackingFrame {
  landmarks: HandLandmark[][];
  handLabels: string[];
  previewGesture: GestureId | null;
  previewConfidence: number;
}

interface GestureStore {
  enabled: boolean;
  exhibitionMode: boolean;
  cameraReady: boolean;
  cameraError: string | null;
  lastGesture: GestureEvent | null;
  handTracking: HandTrackingFrame | null;
  currentScene: ExperienceScene;
  guideCompleted: Set<GestureId>;
  routeLitSegments: number;
  badgeCollected: boolean;
  windReleased: boolean;
  sceneryIndex: number;
  reducedMotion: boolean;

  setEnabled: (enabled: boolean) => void;
  setExhibitionMode: (mode: boolean) => void;
  setCameraReady: (ready: boolean) => void;
  setCameraError: (error: string | null) => void;
  emitGesture: (event: GestureEvent) => void;
  setHandTracking: (frame: HandTrackingFrame | null) => void;
  setCurrentScene: (scene: ExperienceScene) => void;
  markGuideGesture: (id: GestureId) => void;
  isGuideComplete: () => boolean;
  incrementRouteSegment: () => void;
  resetRouteSegments: () => void;
  setBadgeCollected: (collected: boolean) => void;
  setWindReleased: (released: boolean) => void;
  nextScenery: () => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useGestureStore = create<GestureStore>()(
  persist(
    (set, get) => ({
      enabled: false,
      exhibitionMode: false,
      cameraReady: false,
      cameraError: null,
      lastGesture: null,
      handTracking: null,
      currentScene: "home",
      guideCompleted: new Set(),
      routeLitSegments: 0,
      badgeCollected: false,
      windReleased: false,
      sceneryIndex: 0,
      reducedMotion: false,

      setEnabled: (enabled) => set({ enabled }),
      setExhibitionMode: (exhibitionMode) => set({ exhibitionMode }),
      setCameraReady: (cameraReady) => set({ cameraReady }),
      setCameraError: (cameraError) => set({ cameraError }),
      emitGesture: (event) => set({ lastGesture: event }),
      setHandTracking: (handTracking) => set({ handTracking }),
      setCurrentScene: (currentScene) => set({ currentScene }),
      markGuideGesture: (id) => {
        const next = new Set(get().guideCompleted);
        next.add(id);
        set({ guideCompleted: next });
      },
      isGuideComplete: () => {
        return get().guideCompleted.size >= GESTURE_CONFIG.guideRequiredCount;
      },
      incrementRouteSegment: () =>
        set((s) => ({ routeLitSegments: s.routeLitSegments + 1 })),
      resetRouteSegments: () => set({ routeLitSegments: 0 }),
      setBadgeCollected: (badgeCollected) => set({ badgeCollected }),
      setWindReleased: (windReleased) => set({ windReleased }),
      nextScenery: () =>
        set((s) => ({ sceneryIndex: (s.sceneryIndex + 1) % 4 })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: "slow-down-gesture",
      partialize: (state) => ({
        guideCompleted: Array.from(state.guideCompleted),
        badgeCollected: state.badgeCollected,
      }),
      merge: (persisted, current) => {
        const p = persisted as { guideCompleted?: GestureId[] } | undefined;
        return {
          ...current,
          guideCompleted: new Set(p?.guideCompleted ?? []),
        };
      },
    },
  ),
);
