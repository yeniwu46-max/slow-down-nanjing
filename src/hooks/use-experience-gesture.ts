"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useExperienceCamera } from "@/components/experience/experience-camera-provider";
import {
  detectGestures,
  previewGestureFromLandmarks,
  resetGestureDetector,
} from "@/lib/gesture/gesture-detector";
import { GESTURE_CONFIG } from "@/lib/gesture/config";
import {
  expandedAllowedGestures,
  normalizeGestureForScene,
} from "@/lib/gesture/scene-actions";
import type { ExperienceScene, GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

interface UseExperienceGestureOptions {
  scene: ExperienceScene;
  onGesture?: (id: GestureId, rawId: GestureId) => void;
}

export function useExperienceGesture({
  scene,
  onGesture,
}: UseExperienceGestureOptions) {
  const router = useRouter();
  const { registerHandler, bindVideoElement } = useExperienceCamera();
  const onGestureRef = useRef(onGesture);
  const navigatingRef = useRef(false);
  const sceneRef = useRef(scene);

  const emitGesture = useGestureStore((s) => s.emitGesture);
  const setHandTracking = useGestureStore((s) => s.setHandTracking);
  const setCurrentScene = useGestureStore((s) => s.setCurrentScene);
  const markGuideGesture = useGestureStore((s) => s.markGuideGesture);

  const allowedGestures = useMemo(
    () => expandedAllowedGestures(scene),
    [scene],
  );
  const allowedRef = useRef(allowedGestures);

  sceneRef.current = scene;
  allowedRef.current = allowedGestures;
  onGestureRef.current = onGesture;

  useEffect(() => {
    setCurrentScene(scene);
    navigatingRef.current = false;
  }, [scene, setCurrentScene]);

  const handleConfirmed = useCallback((rawId: GestureId) => {
    const currentScene = sceneRef.current;
    const id = normalizeGestureForScene(currentScene, rawId);

    emitGesture({
      id,
      confidence: 1,
      timestamp: Date.now(),
    });

    if (currentScene === "guide") {
      markGuideGesture(id);
      const done = useGestureStore.getState().guideCompleted;
      if (
        done.size >= GESTURE_CONFIG.guideRequiredCount &&
        !navigatingRef.current
      ) {
        navigatingRef.current = true;
        setTimeout(() => router.push("/experience/wind"), 1200);
      }
    }

    onGestureRef.current?.(id, rawId);
  }, [emitGesture, markGuideGesture, router]);

  const handleConfirmedRef = useRef(handleConfirmed);
  handleConfirmedRef.current = handleConfirmed;

  useEffect(() => {
    const unregister = registerHandler((results) => {
      const preview = previewGestureFromLandmarks(results.multiHandLandmarks);

      setHandTracking({
        landmarks: results.multiHandLandmarks,
        handLabels: results.multiHandedness.map((label) =>
          label === "Left" ? "\u5de6\u624b" : label === "Right" ? "\u53f3\u624b" : label,
        ),
        previewGesture: preview?.id ?? null,
        previewConfidence: preview?.confidence ?? 0,
      });

      const detected = detectGestures(results.multiHandLandmarks);
      if (!detected) return;

      if (!allowedRef.current.includes(detected.id)) return;

      handleConfirmedRef.current(detected.id);
    });

    return () => {
      unregister();
      resetGestureDetector();
      setHandTracking(null);
    };
  }, [registerHandler, setHandTracking]);

  const navigateNext = useCallback(
    (path: string) => {
      if (navigatingRef.current) return;
      navigatingRef.current = true;
      router.push(path);
    },
    [router],
  );

  return { bindVideoElement, navigateNext, handleConfirmed };
}
