import type { QuillDelta } from "./types";

export function plainTextToDelta(text: string): QuillDelta {
  const normalized = text.endsWith("\n") ? text : `${text}\n`;
  return { ops: [{ insert: normalized }] };
}

export function deltaToPlainText(delta?: QuillDelta | null): string {
  if (!delta?.ops?.length) return "";
  return delta.ops
    .map((op) => {
      if (typeof op.insert === "string") return op.insert;
      return "";
    })
    .join("")
    .trim();
}

const LINE_SPLIT = /[\n\u3002\uFF01\uFF1F]+/;

export function plainTextToLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(LINE_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      if (s.endsWith("\uFF0C") || s.endsWith("\u3002")) return s;
      return `${s}\uFF0C`;
    });
}

export function buildSlowSummary(place: string, plainText: string, moodName?: string): string {
  const excerpt = plainText.slice(0, 48).replace(/\n/g, "");
  const moodPart = moodName ? `\u5FC3\u60C5\u662F\u300C${moodName}\u300D\u3002` : "";
  if (!excerpt) {
    return `\u5728${place}\u7559\u4E0B\u4E86\u4E00\u6BB5\u6162\u884C\u7684\u8DB3\u8FF9\u3002${moodPart}\u613F\u4F60\u5E38\u5E38\u62E5\u6709\u8FD9\u6837\u7684\u65F6\u523B\u3002`;
  }
  const ellipsis = plainText.length > 48 ? "\u2026" : "";
  return `\u4ECA\u5929\u7684\u4F60\u5728${place}\u6162\u6162\u8BB0\u5F55\uFF1A\u300C${excerpt}${ellipsis}\u300D${moodPart}\u8FD9\u662F\u5C5E\u4E8E\u4F60\u7684\u6162\u751F\u6D3B\u3002`;
}
