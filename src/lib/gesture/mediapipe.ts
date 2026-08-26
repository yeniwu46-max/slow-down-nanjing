"use client";

import { GESTURE_CONFIG } from "./config";
import type { HandLandmark } from "./types";

export type HandsResultsCallback = (results: {
  multiHandLandmarks: HandLandmark[][];
  multiHandedness: string[];
}) => void;

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

type HandLandmarkerInstance = import("@mediapipe/tasks-vision").HandLandmarker;

let handLandmarker: HandLandmarkerInstance | null = null;
let landmarkerPromise: Promise<HandLandmarkerInstance> | null = null;
let activeCallback: HandsResultsCallback = () => {};
let rafId: number | null = null;
let videoElement: HTMLVideoElement | null = null;
let mediaStream: MediaStream | null = null;
let lastVideoTime = -1;
let startingPromise: Promise<void> | null = null;
let recoveringStream = false;
let visibilityBound = false;

async function createLandmarker(): Promise<HandLandmarkerInstance> {
  if (handLandmarker) return handLandmarker;
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const { HandLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

    const options = {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU" as const,
      },
      runningMode: "VIDEO" as const,
      numHands: 2,
      minHandDetectionConfidence: GESTURE_CONFIG.mediapipeDetection,
      minHandPresenceConfidence: GESTURE_CONFIG.mediapipeTracking,
      minTrackingConfidence: GESTURE_CONFIG.mediapipeTracking,
    };

    try {
      handLandmarker = await HandLandmarker.createFromOptions(vision, options);
    } catch {
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        ...options,
        baseOptions: { ...options.baseOptions, delegate: "CPU" },
      });
    }

    return handLandmarker;
  })();

  return landmarkerPromise;
}

function bindVisibilityRecovery() {
  if (visibilityBound || typeof document === "undefined") return;
  visibilityBound = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !videoElement) return;
    void resumeVideoPlayback(videoElement);
  });
}

async function playVideo(video: HTMLVideoElement) {
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;

  if (video.readyState < 2) {
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      const onReady = () => {
        video.removeEventListener("loadeddata", onReady);
        resolve();
      };
      video.addEventListener("loadeddata", onReady, { once: true });
    });
  }

  try {
    await video.play();
  } catch {
    await new Promise((r) => setTimeout(r, 120));
    await video.play().catch(() => undefined);
  }
}

async function resumeVideoPlayback(video: HTMLVideoElement) {
  if (video.paused && mediaStream?.active) {
    await playVideo(video);
    ensureDetectionLoop();
  }
}

async function ensureMediaStream(): Promise<MediaStream> {
  if (mediaStream?.active) return mediaStream;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
    },
    audio: false,
  });

  const track = mediaStream.getVideoTracks()[0];
  track.addEventListener("ended", () => {
    mediaStream = null;
    if (videoElement && !recoveringStream) {
      void recoverStream();
    }
  });

  return mediaStream;
}

async function recoverStream() {
  if (recoveringStream || !videoElement) return;
  recoveringStream = true;
  try {
    const stream = await ensureMediaStream();
    videoElement.srcObject = stream;
    await playVideo(videoElement);
    lastVideoTime = -1;
    ensureDetectionLoop();
  } catch {
    // next attach will retry
  } finally {
    recoveringStream = false;
  }
}

function ensureDetectionLoop() {
  if (rafId === null) {
    detectionLoop();
  }
}

function detectionLoop() {
  rafId = requestAnimationFrame(detectionLoop);

  if (!videoElement || !handLandmarker) return;

  const video = videoElement;
  if (video.readyState < 2) return;

  if (video.paused && mediaStream?.active) {
    void resumeVideoPlayback(video);
    return;
  }

  if (video.currentTime === lastVideoTime) return;

  lastVideoTime = video.currentTime;
  try {
    const results = handLandmarker.detectForVideo(video, performance.now());
    const multiHandLandmarks = (results.landmarks ?? []).map((hand) =>
      hand.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
      })),
    ) as HandLandmark[][];
    const multiHandedness =
      results.handedness?.map((h) => h[0]?.categoryName ?? "") ?? [];
    activeCallback({ multiHandLandmarks, multiHandedness });
  } catch {
    // skip frame on transient WASM errors
  }
}

async function attachStreamToVideo(video: HTMLVideoElement) {
  const stream = await ensureMediaStream();
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }
  await playVideo(video);
  videoElement = video;
  lastVideoTime = -1;
  ensureDetectionLoop();
}

export function setResultsCallback(onResults: HandsResultsCallback) {
  activeCallback = onResults;
}

export async function startCamera(
  video: HTMLVideoElement,
  onResults: HandsResultsCallback,
) {
  activeCallback = onResults;
  bindVisibilityRecovery();

  if (
    videoElement === video &&
    mediaStream?.active &&
    handLandmarker &&
    video.srcObject === mediaStream
  ) {
    ensureDetectionLoop();
    return;
  }

  if (startingPromise) {
    await startingPromise;
    if (videoElement === video && mediaStream?.active) return;
  }

  startingPromise = (async () => {
    await createLandmarker();
    await attachStreamToVideo(video);
  })();

  try {
    await startingPromise;
  } finally {
    startingPromise = null;
  }
}

/** Reuse an active stream when the video element remounts (route changes). */
export async function reattachVideo(video: HTMLVideoElement) {
  bindVisibilityRecovery();
  await createLandmarker();

  if (mediaStream?.active) {
    videoElement = video;
    if (video.srcObject !== mediaStream) {
      video.srcObject = mediaStream;
    }
    await playVideo(video);
    lastVideoTime = -1;
    ensureDetectionLoop();
    return;
  }

  await attachStreamToVideo(video);
}

export async function initHands(onResults: HandsResultsCallback) {
  activeCallback = onResults;
  await createLandmarker();
  return { hands: handLandmarker, camera: null };
}

export async function stopCamera(options?: { keepStream?: boolean }) {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (!options?.keepStream && mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  if (videoElement) {
    if (!options?.keepStream) {
      videoElement.srcObject = null;
    }
    videoElement = null;
  }

  if (!options?.keepStream) {
    activeCallback = () => {};
  }

  lastVideoTime = -1;
  startingPromise = null;
}

export async function disposeLandmarker() {
  await stopCamera();
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
  landmarkerPromise = null;
}
