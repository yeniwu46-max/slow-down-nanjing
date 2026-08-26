export type ArGestureId = "open_palm" | "prayer" | "wave" | "heart";

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface ArGestureEvent {
  id: ArGestureId;
  confidence: number;
  timestamp: number;
}

export const AR_GESTURE_HINTS: Record<
  ArGestureId,
  { label: string; description: string }
> = {
  open_palm: { label: "张开手掌", description: "湖风粒子飘落" },
  prayer: { label: "双手合十", description: "开启冥想模式" },
  wave: { label: "挥手", description: "白鹭飞起" },
  heart: { label: "比心", description: "生成纪念帧" },
};
