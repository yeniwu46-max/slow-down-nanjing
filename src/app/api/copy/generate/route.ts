import { NextResponse } from "next/server";
import { AGENT_PERSONAS } from "@/lib/agents/personas";
import { sparkChat, type SparkMessage } from "@/lib/spark/client";

const POEM_TEMPLATES = [
  "在{kw}，脚步轻得像落叶，城市的声音慢慢靠近。",
  "{kw}的风里，有旧时光的温度，也有今天的小确幸。",
  "慢一点，才能在{kw}，听见自己与城市的心跳。",
];

type CopyStyle = "xhs" | "moment" | "postcard" | "poster";

interface CopyRequestBody {
  keywords?: string[];
  mood?: string;
  style?: CopyStyle;
}

interface CopyResult {
  poem: string;
  postcardText: string;
  xhsCopy: string;
  momentText: string;
  posterTitle: string;
}

function fallback(keywords: string[]): CopyResult {
  const kw = keywords[0] ?? "南京";
  const template =
    POEM_TEMPLATES[Math.floor(Math.random() * POEM_TEMPLATES.length)];
  const poem = template.replace("{kw}", kw);
  return {
    poem,
    postcardText: poem,
    xhsCopy: `${poem}\n\n#宁可慢一点 #南京慢行`,
    momentText: `${poem} 🍃`,
    posterTitle: keywords.join(" · ") || "宁可慢一点",
  };
}

const STYLE_LABEL: Record<CopyStyle, string> = {
  xhs: "小红书种草文案（带 emoji 和话题标签）",
  moment: "朋友圈短文案（简短走心，30字内）",
  postcard: "明信片寄语（一两句温柔诗意短句）",
  poster: "海报标题（6字内，有意境）",
};

function buildPrompt(keywords: string[], mood: string | undefined): string {
  const kw = keywords.filter(Boolean).join("、") || "南京、慢行";
  const moodLine = mood ? `当前心情：${mood}。` : "";
  return (
    `请围绕关键词「${kw}」创作一组「宁可慢一点」南京城市漫游分享文案。${moodLine}` +
    "只返回 JSON 对象，不要任何额外说明或代码块标记，格式如下：" +
    `{"poem":"一句富有画面感的城市短诗","postcardText":"${STYLE_LABEL.postcard}",` +
    `"xhsCopy":"${STYLE_LABEL.xhs}","momentText":"${STYLE_LABEL.moment}",` +
    `"posterTitle":"${STYLE_LABEL.poster}"}`
  );
}

function parse(raw: string, keywords: string[]): CopyResult {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return fallback(keywords);
  try {
    const p = JSON.parse(raw.slice(start, end + 1));
    const fb = fallback(keywords);
    return {
      poem: String(p.poem ?? fb.poem),
      postcardText: String(p.postcardText ?? fb.postcardText),
      xhsCopy: String(p.xhsCopy ?? fb.xhsCopy),
      momentText: String(p.momentText ?? fb.momentText),
      posterTitle: String(p.posterTitle ?? fb.posterTitle),
    };
  } catch {
    return fallback(keywords);
  }
}

export async function POST(request: Request) {
  let body: CopyRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(fallback(["南京", "慢行"]));
  }

  const keywords = body.keywords?.length ? body.keywords : ["南京", "慢行"];

  const messages: SparkMessage[] = [
    { role: "system", content: AGENT_PERSONAS.fengxin.systemPrompt },
    { role: "user", content: buildPrompt(keywords, body.mood) },
  ];

  try {
    const raw = await sparkChat(messages, { temperature: 0.9 });
    return NextResponse.json(parse(raw, keywords));
  } catch {
    // 星火失败时回退到本地模板，保证页面可用
    return NextResponse.json(fallback(keywords));
  }
}
