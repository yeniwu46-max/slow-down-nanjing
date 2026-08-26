"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  detectGestures,
  previewGestureFromLandmarks,
  resetGestureDetector,
} from "@/lib/gesture/gesture-detector";
import {
  setResultsCallback,
  startCamera,
  stopCamera,
} from "@/lib/gesture/mediapipe";
import type { GestureId } from "@/lib/gesture/types";
import { useGestureStore } from "@/stores/use-gesture-store";

interface UseGestureDetectionOptions {
  active?: boolean;
  allowedGestures?: GestureId[];
  onGesture?: (id: GestureId) => void;
}

export function useGestureDetection(options: UseGestureDetectionOptions = {}) {
  const { active = true, allowedGestures, onGesture } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onGestureRef = useRef(onGesture);
  const allowedRef = useRef(allowedGestures);
  const activeRef = useRef(active);
  const cameraStartedRef = useRef(false);

  const setCameraReady = useGestureStore((s) => s.setCameraReady);
  const setCameraError = useGestureStore((s) => s.setCameraError);
  const emitGesture = useGestureStore((s) => s.emitGesture);
  const setHandTracking = useGestureStore((s) => s.setHandTracking);

  onGestureRef.current = onGesture;
  allowedRef.current = allowedGestures;
  activeRef.current = active;

  const processResults = useCallback(
    (results: {
      multiHandLandmarks: { x: number; y: number; z: number }[][];
      multiHandedness: string[];
    }) => {
      if (!activeRef.current) return;

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

      if (
        allowedRef.current &&
        !allowedRef.current.includes(detected.id)
      ) {
        return;
      }

      emitGesture({
        id: detected.id,
        confidence: detected.confidence,
        timestamp: Date.now(),
        position: detected.position,
      });
      onGestureRef.current?.(detected.id);
    },
    [emitGesture, setHandTracking],
  );

  const processResultsRef = useRef(processResults);
  processResultsRef.current = processResults;

  const bindVideoElement = useCallback(
    (element: HTMLVideoElement | null) => {
      videoRef.current = element;

      if (!element || !activeRef.current) return;

      let cancelled = false;

      const handler = (results: Parameters<typeof processResults>[0]) => {
        processResultsRef.current(results);
      };

      startCamera(element, handler)
        .then(() => {
          if (!cancelled) {
            cameraStartedRef.current = true;
            setCameraReady(true);
            setCameraError(null);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            cameraStartedRef.current = false;
            setCameraReady(false);
            setHandTracking(null);
            setCameraError(err.message || "\u65e0\u6cd5\u8bbf\u95ee\u6444\u50cf\u5934");
          }
        });

      return () => {
        cancelled = true;
      };
    },
    [setCameraError, setCameraReady, setHandTracking],
  );

  useEffect(() => {
    setResultsCallback((results) => processResultsRef.current(results));
  }, []);

  useEffect(() => {
    if (active) return;

    setHandTracking(null);
    if (cameraStartedRef.current) {
      void stopCamera();
      cameraStartedRef.current = false;
      setCameraReady(false);
    }
  }, [active, setCameraReady, setHandTracking]);

  useEffect(() => {
    return () => {
      if (cameraStartedRef.current) {
        void stopCamera();
        cameraStartedRef.current = false;
      }
      resetGestureDetector();
      setHandTracking(null);
      setCameraReady(false);
    };
  }, [setCameraReady, setHandTracking]);

  return { videoRef, canvasRef, bindVideoElement };
}
