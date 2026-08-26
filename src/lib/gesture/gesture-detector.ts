import { GestureEstimator } from "fingerpose";
import { GESTURE_CONFIG } from "./config";
import type { GestureId, HandLandmark } from "./types";
import { ALL_FINGERPOSE_GESTURES } from "./fingerpose-gestures";

interface MotionState {
  palmHistory: { x: number; y: number; t: number }[];
  waveCount: number;
  waveWindowStart: number;
}

const FINGER_TIPS = [8, 12, 16, 20] as const;
const FINGER_MCPS = [5, 9, 13, 17] as const;
const NON_INDEX_TIPS = [12, 16, 20] as const;
const NON_INDEX_MCPS = [9, 13, 17] as const;

let lastTriggerTime = 0;
let pendingGesture: GestureId | null = null;
let pendingCount = 0;

const motion: MotionState = {
  palmHistory: [],
  waveCount: 0,
  waveWindowStart: 0,
};

const estimator = new GestureEstimator(ALL_FINGERPOSE_GESTURES);

function resetPending() {
  pendingGesture = null;
  pendingCount = 0;
}

function clearPendingIfNot(id: GestureId) {
  if (pendingGesture !== null && pendingGesture !== id) {
    resetPending();
  }
}

function emitIfReady(id: GestureId): GestureId | null {
  if (pendingGesture === id) {
    pendingCount += 1;
  } else {
    pendingGesture = id;
    pendingCount = 1;
  }

  if (pendingCount < GESTURE_CONFIG.framesRequired) return null;

  const now = Date.now();
  if (now - lastTriggerTime < GESTURE_CONFIG.cooldownMs) return null;

  lastTriggerTime = now;
  resetPending();
  return id;
}

function wristCenter(landmarks: HandLandmark[]) {
  const wrist = landmarks[0];
  return { x: wrist.x, y: wrist.y };
}

function isFingerExtended(landmarks: HandLandmark[], tipIndex: number, mcpIndex: number) {
  return landmarks[tipIndex].y < landmarks[mcpIndex].y + 0.02;
}

function isFingerCurled(landmarks: HandLandmark[], tipIndex: number, mcpIndex: number) {
  return landmarks[tipIndex].y > landmarks[mcpIndex].y - 0.015;
}

function countExtendedFingers(landmarks: HandLandmark[]) {
  let extended = 0;
  for (let i = 0; i < FINGER_TIPS.length; i += 1) {
    if (isFingerExtended(landmarks, FINGER_TIPS[i], FINGER_MCPS[i])) {
      extended += 1;
    }
  }
  return extended;
}

function isOpenPalm(landmarks: HandLandmark[]) {
  return countExtendedFingers(landmarks) >= GESTURE_CONFIG.openPalmMinFingers;
}

/** Strict point / pinch: index out, thumb touching index, other fingers curled. */
function detectPointClick(landmarks: HandLandmark[]) {
  if (isOpenPalm(landmarks)) return false;

  const indexExtended = isFingerExtended(landmarks, 8, 5);
  if (!indexExtended) return false;

  const thumb = landmarks[4];
  const index = landmarks[8];
  const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  if (pinchDist >= GESTURE_CONFIG.pinchMaxDistance) return false;

  let curled = 0;
  for (let i = 0; i < NON_INDEX_TIPS.length; i += 1) {
    if (isFingerCurled(landmarks, NON_INDEX_TIPS[i], NON_INDEX_MCPS[i])) {
      curled += 1;
    }
  }

  return curled >= GESTURE_CONFIG.pointMinCurledFingers;
}

function detectTwoHandsTogether(left: HandLandmark[], right: HandLandmark[]) {
  const lw = left[0];
  const rw = right[0];
  return Math.hypot(lw.x - rw.x, lw.y - rw.y) < GESTURE_CONFIG.twoHandsMaxDistance;
}

function detectEmbraceCity(left: HandLandmark[], right: HandLandmark[]) {
  if (!detectTwoHandsTogether(left, right)) return false;
  const le = left[13];
  const re = right[13];
  const wristDist = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);
  const elbowSpread = Math.hypot(le.x - re.x, le.y - re.y);
  return elbowSpread > wristDist * 0.9;
}

function trackMotion(landmarks: HandLandmark[], now: number): GestureId | null {
  const center = wristCenter(landmarks);
  motion.palmHistory.push({ ...center, t: now });
  motion.palmHistory = motion.palmHistory.filter((p) => now - p.t < 2000);

  if (motion.palmHistory.length >= 2) {
    const oldest = motion.palmHistory[0];
    const newest = motion.palmHistory[motion.palmHistory.length - 1];
    const dy = oldest.y - newest.y;
    const dx = newest.x - oldest.x;

    if (dy > GESTURE_CONFIG.swipeUpMinDy) {
      clearPendingIfNot("light_route");
      const id = emitIfReady("light_route");
      if (id) return id;
    }

    if (Math.abs(dx) > 0.05) {
      if (now - motion.waveWindowStart > 2000) {
        motion.waveWindowStart = now;
        motion.waveCount = 0;
      }
      motion.waveCount += 1;
      if (motion.waveCount >= GESTURE_CONFIG.waveMinCount) {
        motion.waveCount = 0;
        clearPendingIfNot("switch_scenery");
        const id = emitIfReady("switch_scenery");
        if (id) return id;
      }
    }

    if (isOpenPalm(landmarks) && dy > 0.04) {
      clearPendingIfNot("start_journey");
      const id = emitIfReady("start_journey");
      if (id) return id;
    }
  }

  return null;
}

function classifySingleHand(landmarks: HandLandmark[]) {
  if (isOpenPalm(landmarks)) {
    return { id: "release_wind" as GestureId, confidence: 0.88 };
  }

  if (detectPointClick(landmarks)) {
    return { id: "open_story" as GestureId, confidence: 0.86 };
  }

  const estimated = estimator.estimate(
    landmarks,
    GESTURE_CONFIG.previewThreshold,
  );
  if (estimated.gestures.length > 0) {
    const match = estimated.gestures[0];
    if (match.score >= GESTURE_CONFIG.previewThreshold) {
      return {
        id: match.name as GestureId,
        confidence: match.score,
      };
    }
  }

  return null;
}

export function detectGestures(
  multiHandLandmarks: HandLandmark[][],
): { id: GestureId; confidence: number; position?: { x: number; y: number } } | null {
  const now = Date.now();

  if (multiHandLandmarks.length >= 2) {
    const [left, right] = multiHandLandmarks;
    if (detectEmbraceCity(left, right)) {
      clearPendingIfNot("embrace_city");
      const id = emitIfReady("embrace_city");
      if (id) {
        return {
          id,
          confidence: 0.9,
          position: {
            x: (left[0].x + right[0].x) / 2,
            y: (left[0].y + right[0].y) / 2,
          },
        };
      }
    } else if (detectTwoHandsTogether(left, right)) {
      clearPendingIfNot("collect_badge");
      const id = emitIfReady("collect_badge");
      if (id) {
        return {
          id,
          confidence: 0.92,
          position: {
            x: (left[0].x + right[0].x) / 2,
            y: (left[0].y + right[0].y) / 2,
          },
        };
      }
    }
  }

  if (multiHandLandmarks.length >= 1) {
    const landmarks = multiHandLandmarks[0];
    const center = wristCenter(landmarks);

    const motionResult = trackMotion(landmarks, now);
    if (motionResult) {
      return { id: motionResult, confidence: 0.88, position: center };
    }

    const classified = classifySingleHand(landmarks);
    if (!classified) {
      resetPending();
      return null;
    }

    clearPendingIfNot(classified.id);
    const id = emitIfReady(classified.id);
    if (id) {
      return { id, confidence: classified.confidence, position: center };
    }
  } else {
    resetPending();
  }

  return null;
}

export function previewGestureFromLandmarks(
  multiHandLandmarks: HandLandmark[][],
): { id: GestureId; confidence: number } | null {
  if (multiHandLandmarks.length >= 2) {
    const [left, right] = multiHandLandmarks;
    if (detectEmbraceCity(left, right)) {
      return { id: "embrace_city", confidence: 0.9 };
    }
    if (detectTwoHandsTogether(left, right)) {
      return { id: "collect_badge", confidence: 0.92 };
    }
  }

  if (multiHandLandmarks.length >= 1) {
    return classifySingleHand(multiHandLandmarks[0]);
  }

  return null;
}

export function resetGestureDetector() {
  lastTriggerTime = 0;
  resetPending();
  motion.palmHistory = [];
  motion.waveCount = 0;
  motion.waveWindowStart = 0;
}
