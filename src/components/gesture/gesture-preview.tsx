"use client";

import { useCallback, useEffect, useRef } from "react";
import { drawHandLandmarks } from "@/lib/gesture/draw-hand-landmarks";
import { GESTURE_HINTS } from "@/lib/gesture/types";
import { cn } from "@/lib/utils";
import { useGestureStore } from "@/stores/use-gesture-store";

interface GesturePreviewProps {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  onVideoMount?: (element: HTMLVideoElement | null) => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  className?: string;
  draggable?: boolean;
  size?: "sm" | "md";
}

export function GesturePreview({
  videoRef,
  onVideoMount,
  canvasRef,
  className,
  draggable = true,
  size = "sm",
}: GesturePreviewProps) {
  const lastGesture = useGestureStore((s) => s.lastGesture);
  const handTracking = useGestureStore((s) => s.handTracking);
  const cameraError = useGestureStore((s) => s.cameraError);
  const cameraReady = useGestureStore((s) => s.cameraReady);
  const pulseRef = useRef<HTMLDivElement>(null);
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = canvasRef ?? internalCanvasRef;

  const isMd = size === "md";
  const videoHeight = isMd ? "h-[180px]" : "h-[135px]";
  const containerWidth = isMd ? "w-56" : "w-44";

  useEffect(() => {
    if (!lastGesture || !pulseRef.current) return;
    pulseRef.current.classList.remove("gesture-pulse");
    void pulseRef.current.offsetWidth;
    pulseRef.current.classList.add("gesture-pulse");
  }, [lastGesture?.timestamp]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas || cameraError) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawHandLandmarks(
      ctx,
      handTracking?.landmarks ?? [],
      displayWidth,
      displayHeight,
      {
        mirror: true,
        handLabels: handTracking?.handLabels,
      },
    );
  }, [handTracking, cameraError, overlayRef]);

  const handCount = handTracking?.landmarks.length ?? 0;
  const confirmedLabel =
    lastGesture && handCount > 0
      ? GESTURE_HINTS[lastGesture.id]?.label ?? lastGesture.id
      : null;

  const setVideoNode = useCallback(
    (node: HTMLVideoElement | null) => {
      if (videoRef) {
        videoRef.current = node;
      }
      onVideoMount?.(node);
    },
    [onVideoMount, videoRef],
  );

  return (
    <div
      ref={pulseRef}
      className={cn(
        "glass overflow-hidden rounded-xl shadow-m",
        draggable && "fixed bottom-6 right-6 z-[60]",
        containerWidth,
        className,
      )}
    >
      <div className="border-b border-white/40 px-2 py-1 text-[10px] text-rock">
        {cameraReady
          ? `\u68c0\u6d4b\u5230 ${handCount} \u53ea\u624b`
          : "\u6444\u50cf\u5934\u521d\u59cb\u5316\u2026"}
      </div>

      {cameraError ? (
        <div className="flex h-[135px] items-center justify-center px-3 text-center text-xs text-rock">
          {cameraError}
          <br />
          {"\u53ef\u7528\u952e\u76d8 1\u20135 \u6a21\u62df\u624b\u52bf"}
        </div>
      ) : (
        <div className={cn("relative w-full bg-rock/10", videoHeight)}>
          <video
            ref={setVideoNode}
            className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
            playsInline
            muted
            autoPlay
          />
          {handTracking?.previewGesture && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-primary/90 px-2 py-1 text-center text-[11px] font-semibold text-white">
              {GESTURE_HINTS[handTracking.previewGesture].label}
              {handTracking.previewConfidence > 0 && (
                <span className="font-normal opacity-90">
                  {" \u00b7 "}
                  {Math.round(handTracking.previewConfidence * 100)}%
                </span>
              )}
            </div>
          )}
          <canvas
            ref={overlayRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden
          />
        </div>
      )}

      <div className="space-y-0.5 border-t border-white/50 px-2 py-1.5 text-center">
        {handTracking?.previewGesture && (
          <p className="text-[10px] text-rock">
            {"\u8bc6\u522b\u4e2d\uff1a"}
            <span className="font-medium text-primary">
              {GESTURE_HINTS[handTracking.previewGesture].label}
            </span>
            {handTracking.previewConfidence > 0 && (
              <span className="text-rock">
                {" "}
                {Math.round(handTracking.previewConfidence * 100)}%
              </span>
            )}
          </p>
        )}
        {confirmedLabel && (
          <p className="text-[11px] font-medium text-primary">
            {"\u2713 "}
            {confirmedLabel}
          </p>
        )}
      </div>
    </div>
  );
}
