/** Tunable gesture detection settings (exhibition-friendly) */
export const GESTURE_CONFIG = {
  /** Fingerpose match threshold */
  confidenceThreshold: 0.65,
  previewThreshold: 0.55,
  /** Frames the same gesture must hold before firing */
  framesRequired: 3,
  /** Min ms between two confirmed gestures */
  cooldownMs: 900,
  /** Guide scene: how many distinct gestures unlock next scene */
  guideRequiredCount: 2,
  /** Open palm: min extended fingers (of 4, excluding thumb) */
  openPalmMinFingers: 3,
  /** Pinch: thumb-index distance (normalized) */
  pinchMaxDistance: 0.045,
  /** Point: min curled non-index fingers for open_story */
  pointMinCurledFingers: 2,
  /** Two hands together max wrist distance */
  twoHandsMaxDistance: 0.22,
  /** Swipe up min dy (normalized) */
  swipeUpMinDy: 0.06,
  /** Wave: min horizontal moves */
  waveMinCount: 3,
  /** MediaPipe min detection confidence */
  mediapipeDetection: 0.65,
  mediapipeTracking: 0.65,
} as const;
