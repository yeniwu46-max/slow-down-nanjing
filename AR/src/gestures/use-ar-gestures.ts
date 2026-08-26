import { useCallback, useEffect, useRef, useState } from "react";
import { detectArGestures, resetArGestureDetector } from "./detector";
import { startHandsCamera, stopHandsCamera } from "./mediapipe";
import type { ArGestureId } from "./types";

interface UseArGestureOptions {
  active?: boolean;
  allowedGestures?: ArGestureId[];
  onGesture?: (id: ArGestureId) => void;
}

export function useArGestures(options: UseArGestureOptions = {}) {
  const { active = true, allowedGestures, onGesture } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const onGestureRef = useRef(onGesture);
  const allowedRef = useRef(allowedGestures);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  onGestureRef.current = onGesture;
  allowedRef.current = allowedGestures;

  const handleResults = useCallback(
    (results: { multiHandLandmarks: { x: number; y: number; z: number }[][] }) => {
      const detected = detectArGestures(results.multiHandLandmarks);
      if (!detected) return;
      if (allowedRef.current && !allowedRef.current.includes(detected.id)) return;
      onGestureRef.current?.(detected.id);
    },
    [],
  );

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    startHandsCamera(video, handleResults)
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "手势相机启动失败");
      });

    return () => {
      cancelled = true;
      void stopHandsCamera();
      resetArGestureDetector();
      setReady(false);
    };
  }, [active, handleResults]);

  return { videoRef, ready, error };
}
