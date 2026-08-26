"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  disposeLandmarker,
  reattachVideo,
  setResultsCallback,
  startCamera,
  type HandsResultsCallback,
} from "@/lib/gesture/mediapipe";
import { useGestureStore } from "@/stores/use-gesture-store";

interface ExperienceCameraContextValue {
  registerHandler: (handler: HandsResultsCallback) => () => void;
  bindVideoElement: (element: HTMLVideoElement | null) => void;
}

const ExperienceCameraContext =
  createContext<ExperienceCameraContextValue | null>(null);

export function ExperienceCameraProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<HandsResultsCallback>(() => {});
  const boundVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamStartedRef = useRef(false);

  const setCameraReady = useGestureStore((s) => s.setCameraReady);
  const setCameraError = useGestureStore((s) => s.setCameraError);

  const dispatchResults = useCallback<HandsResultsCallback>((results) => {
    handlerRef.current(results);
  }, []);

  const registerHandler = useCallback((handler: HandsResultsCallback) => {
    handlerRef.current = handler;
    setResultsCallback(dispatchResults);
    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = () => {};
      }
    };
  }, [dispatchResults]);

  const bindVideoElement = useCallback(
    (element: HTMLVideoElement | null) => {
      boundVideoRef.current = element;
      if (!element) return;

      const boot = async () => {
        try {
          if (streamStartedRef.current) {
            await reattachVideo(element);
          } else {
            await startCamera(element, dispatchResults);
            streamStartedRef.current = true;
          }
          setCameraReady(true);
          setCameraError(null);
        } catch (err) {
          streamStartedRef.current = false;
          setCameraReady(false);
          setCameraError(
            err instanceof Error
              ? err.message
              : "\u65e0\u6cd5\u8bbf\u95ee\u6444\u50cf\u5934",
          );
        }
      };

      void boot();
    },
    [dispatchResults, setCameraError, setCameraReady],
  );

  useEffect(() => {
    setResultsCallback(dispatchResults);
    return () => {
      void disposeLandmarker();
      streamStartedRef.current = false;
      setCameraReady(false);
    };
  }, [dispatchResults, setCameraReady]);

  return (
    <ExperienceCameraContext.Provider
      value={{ registerHandler, bindVideoElement }}
    >
      {children}
    </ExperienceCameraContext.Provider>
  );
}

export function useExperienceCamera() {
  const ctx = useContext(ExperienceCameraContext);
  if (!ctx) {
    throw new Error("useExperienceCamera must be used within ExperienceCameraProvider");
  }
  return ctx;
}
