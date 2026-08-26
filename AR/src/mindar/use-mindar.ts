import { useCallback, useEffect, useRef, useState } from "react";
// @ts-expect-error mind-ar has no official types
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import type { MindARThreeInstance } from "@/types/mindar";

interface UseMindAROptions {
  targetSrc: string;
  active?: boolean;
  onTargetFound?: () => void;
  onTargetLost?: () => void;
}

export function useMindAR({
  targetSrc,
  active = true,
  onTargetFound,
  onTargetLost,
}: UseMindAROptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mindarRef = useRef<MindARThreeInstance | null>(null);
  const [anchorGroup, setAnchorGroup] = useState<import("three").Group | null>(null);
  const [ready, setReady] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFoundRef = useRef(onTargetFound);
  const onLostRef = useRef(onTargetLost);
  onFoundRef.current = onTargetFound;
  onLostRef.current = onTargetLost;

  const stop = useCallback(async () => {
    const instance = mindarRef.current;
    if (instance) {
      instance.stop();
      mindarRef.current = null;
    }
    setAnchorGroup(null);
    setReady(false);
    setTracking(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const start = async () => {
      try {
        const mindarThree = new MindARThree({
          container,
          imageTargetSrc: targetSrc,
          maxTrack: 1,
        }) as MindARThreeInstance;

        if (cancelled) return;

        mindarRef.current = mindarThree;
        const anchor = mindarThree.addAnchor(0);
        setAnchorGroup(anchor.group);

        anchor.onTargetFound(() => {
          setTracking(true);
          onFoundRef.current?.();
        });

        anchor.onTargetLost(() => {
          setTracking(false);
          onLostRef.current?.();
        });

        await mindarThree.start();
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "AR 相机启动失败");
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      void stop();
    };
  }, [active, stop, targetSrc]);

  return {
    containerRef,
    anchorGroup,
    mindar: mindarRef.current,
    ready,
    tracking,
    error,
    stop,
  };
}
