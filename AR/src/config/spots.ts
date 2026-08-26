export type ArGestureId = "open_palm" | "prayer" | "wave" | "heart";

export interface ArSpotConfig {
  id: string;
  name: string;
  mindTarget: string;
  markerPreview: string;
  badgeId: string;
  letterTitle: string;
  letterBody: string;
  theme: { primary: string; accent: string };
  gestures: ArGestureId[];
  scene: "XuanwuLakeScene";
}

export const AR_SPOTS: Record<string, ArSpotConfig> = {
  "xuanwu-lake": {
    id: "xuanwu-lake",
    name: "玄武湖公园",
    mindTarget: "/targets/xuanwu-lake.mind",
    markerPreview: "/markers/xuanwu-lake-poster.png",
    badgeId: "xuanwu-lake-letter",
    letterTitle: "湖风信笺",
    letterBody:
      "六朝的烟水在此放慢了脚步。湖风掠过发梢，像一封未拆的信，提醒你：慢一点，才能真正听见自己的呼吸。",
    theme: { primary: "#7FA79B", accent: "#C6A36B" },
    gestures: ["open_palm", "prayer", "wave", "heart"],
    scene: "XuanwuLakeScene",
  },
};

export const DEFAULT_SPOT_ID = "xuanwu-lake";

export function getSpot(id: string | null | undefined): ArSpotConfig | null {
  if (!id) return null;
  return AR_SPOTS[id] ?? null;
}

export function getSpotOrDefault(id: string | null | undefined): ArSpotConfig {
  return getSpot(id) ?? AR_SPOTS[DEFAULT_SPOT_ID];
}
