import type { HandLandmark } from "./types";

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
];

const FINGERTIPS = [4, 8, 12, 16, 20];

export interface DrawHandsOptions {
  mirror?: boolean;
  skeletonColor?: string;
  jointColor?: string;
  fingertipColor?: string;
  handLabels?: string[];
}

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: HandLandmark[][],
  width: number,
  height: number,
  options: DrawHandsOptions = {},
) {
  const {
    mirror = true,
    skeletonColor = "#7fa79b",
    jointColor = "rgba(255, 255, 255, 0.95)",
    fingertipColor = "#c6a36b",
    handLabels,
  } = options;

  ctx.clearRect(0, 0, width, height);

  if (landmarks.length === 0) {
    ctx.fillStyle = "rgba(142, 139, 134, 0.85)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u624b\u638c\u672a\u5165\u955c", width / 2, height / 2);
    return;
  }

  landmarks.forEach((hand, handIndex) => {
    const label = handLabels?.[handIndex];
    const wrist = hand[0];
    const wx = toX(wrist.x, width, mirror);
    const wy = toY(wrist.y, height);

    ctx.strokeStyle = skeletonColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    for (const [a, b] of HAND_CONNECTIONS) {
      const p1 = hand[a];
      const p2 = hand[b];
      ctx.beginPath();
      ctx.moveTo(toX(p1.x, width, mirror), toY(p1.y, height));
      ctx.lineTo(toX(p2.x, width, mirror), toY(p2.y, height));
      ctx.stroke();
    }

    hand.forEach((point, i) => {
      const x = toX(point.x, width, mirror);
      const y = toY(point.y, height);
      const isTip = FINGERTIPS.includes(i);
      ctx.beginPath();
      ctx.arc(x, y, isTip ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? fingertipColor : jointColor;
      ctx.fill();
      if (isTip) {
        ctx.strokeStyle = skeletonColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    if (label) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(label, wx + 6, wy - 6);
    }
  });
}

function toX(x: number, width: number, mirror: boolean) {
  return mirror ? (1 - x) * width : x * width;
}

function toY(y: number, height: number) {
  return y * height;
}
