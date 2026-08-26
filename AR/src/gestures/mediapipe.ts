import type { HandLandmark } from "./types";

export type HandsResultsCallback = (results: {
  multiHandLandmarks: HandLandmark[][];
  image: HTMLVideoElement | HTMLCanvasElement;
}) => void;

let handsInstance: import("@mediapipe/hands").Hands | null = null;
let cameraInstance: import("@mediapipe/camera_utils").Camera | null = null;
let activeCallback: HandsResultsCallback | null = null;

export async function initHands(onResults: HandsResultsCallback) {
  activeCallback = onResults;

  if (handsInstance) return { hands: handsInstance, camera: cameraInstance };

  const { Hands } = await import("@mediapipe/hands");
  handsInstance = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  handsInstance.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75,
  });

  handsInstance.onResults((results) => {
    if (!activeCallback) return;
    activeCallback({
      multiHandLandmarks: (results.multiHandLandmarks ?? []) as HandLandmark[][],
      image: results.image as unknown as HTMLVideoElement,
    });
  });

  return { hands: handsInstance, camera: cameraInstance };
}

export async function startHandsCamera(
  videoElement: HTMLVideoElement,
  onResults: HandsResultsCallback,
) {
  await initHands(onResults);

  if (cameraInstance) {
    await cameraInstance.stop();
    cameraInstance = null;
  }

  const { Camera } = await import("@mediapipe/camera_utils");
  cameraInstance = new Camera(videoElement, {
    onFrame: async () => {
      if (handsInstance) await handsInstance.send({ image: videoElement });
    },
    width: 640,
    height: 480,
  });

  await cameraInstance.start();
  return cameraInstance;
}

export async function stopHandsCamera() {
  if (cameraInstance) {
    await cameraInstance.stop();
    cameraInstance = null;
  }
  activeCallback = null;
}

export async function attachHandsToVideo(
  videoElement: HTMLVideoElement,
  onResults: HandsResultsCallback,
) {
  await initHands(onResults);
  const tick = async () => {
    if (handsInstance && videoElement.readyState >= 2) {
      await handsInstance.send({ image: videoElement });
    }
    if (activeCallback) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
