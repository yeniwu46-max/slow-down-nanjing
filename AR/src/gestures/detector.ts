import type { HandLandmark } from "./types";
import type { ArGestureId } from "./types";

const COOLDOWN_MS = 1800;
const FRAMES_REQUIRED = 3;

let lastTrigger = 0;
let pending: ArGestureId | null = null;
let pendingCount = 0;
let waveCount = 0;
let waveStart = 0;

function resetPending() {
  pending = null;
  pendingCount = 0;
}

function emitIfReady(id: ArGestureId): ArGestureId | null {
  if (pending === id) pendingCount += 1;
  else {
    pending = id;
    pendingCount = 1;
  }
  if (pendingCount < FRAMES_REQUIRED) return null;
  const now = Date.now();
  if (now - lastTrigger < COOLDOWN_MS) return null;
  lastTrigger = now;
  resetPending();
  return id;
}

function isOpenPalm(landmarks: HandLandmark[]) {
  const tips = [8, 12, 16, 20];
  const mcp = [5, 9, 13, 17];
  let extended = 0;
  for (let i = 0; i < tips.length; i += 1) {
    if (landmarks[tips[i]].y < landmarks[mcp[i]].y) extended += 1;
  }
  return extended >= 3;
}

function isHeart(landmarks: HandLandmark[]) {
  const thumb = landmarks[4];
  const index = landmarks[8];
  const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  return dist < 0.045 && landmarks[12].y > landmarks[9].y;
}

function twoHandsPrayer(left: HandLandmark[], right: HandLandmark[]) {
  const dist = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);
  return dist < 0.12;
}

function detectWave(landmarks: HandLandmark[], now: number) {
  const wrist = landmarks[0];
  if (now - waveStart > 2000) {
    waveStart = now;
    waveCount = 0;
  }
  waveCount += 1;
  if (waveCount >= 4 && Math.abs(wrist.x - 0.5) > 0.05) {
    waveCount = 0;
    return emitIfReady("wave");
  }
  return null;
}

export function detectArGestures(
  multiHandLandmarks: HandLandmark[][],
): { id: ArGestureId; confidence: number } | null {
  const now = Date.now();

  if (multiHandLandmarks.length >= 2) {
    const [left, right] = multiHandLandmarks;
    if (twoHandsPrayer(left, right)) {
      const id = emitIfReady("prayer");
      if (id) return { id, confidence: 0.92 };
    }
  }

  if (multiHandLandmarks.length >= 1) {
    const landmarks = multiHandLandmarks[0];
    if (isHeart(landmarks)) {
      const id = emitIfReady("heart");
      if (id) return { id, confidence: 0.88 };
    }
    if (isOpenPalm(landmarks)) {
      const id = emitIfReady("open_palm");
      if (id) return { id, confidence: 0.85 };
    }
    const wave = detectWave(landmarks, now);
    if (wave) return { id: wave, confidence: 0.82 };
  }

  return null;
}

export function resetArGestureDetector() {
  lastTrigger = 0;
  resetPending();
  waveCount = 0;
  waveStart = 0;
}
