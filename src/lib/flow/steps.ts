export type FlowStepId =
  | "battery"
  | "text"
  | "voice"
  | "photo"
  | "analyzing"
  | "result";

export interface FlowStep {
  id: FlowStepId;
  number: string;
  label: string;
  href: string;
}

export const FLOW_STEPS: FlowStep[] = [
  { id: "battery", number: "01", label: "今天的心情", href: "/flow/battery" },
  { id: "text", number: "02", label: "写下此刻", href: "/flow/text" },
  { id: "voice", number: "03", label: "说一句", href: "/flow/voice" },
  { id: "photo", number: "04", label: "路边的风景", href: "/flow/photo" },
  { id: "analyzing", number: "05", label: "匹配慢路", href: "/flow/analyzing" },
  { id: "result", number: "06", label: "今日金陵路", href: "/flow/result" },
];

export function getStepIndex(stepId: FlowStepId): number {
  return FLOW_STEPS.findIndex((s) => s.id === stepId);
}
