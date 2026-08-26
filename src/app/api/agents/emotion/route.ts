import { NextResponse } from "next/server";
import { AGENT_PERSONAS } from "@/lib/agents/personas";
import { localEmotionResult } from "@/lib/agents/local-fallback";
import { sparkChat, type SparkMessage } from "@/lib/spark/client";

interface EmotionRequestBody {
  /** 用户最近的倾诉文本（可拼接多轮） */
  text?: string;
}

export interface EmotionResult {
  moodLabel: string;
  keywords: string[];
  battery: number;
  advice: string;
  recommendAgent: string;
}

const ANALYSIS_PROMPT =
  "请你作为情绪识别专家，分析用户这段话的情绪状态。" +
  "只返回一个 JSON 对象，不要任何额外说明或代码块标记，格式如下：" +
  '{"moodLabel":"用4字以内概括当前情绪画像","keywords":["情绪关键词1","关键词2","关键词3"],' +
  '"battery":0到100的整数表示慢行电量越疲惫越低,"advice":"一句温柔的慢行建议",' +
  '"recommendAgent":"从 慢慢(路线规划)/风信(文案创作)/金陵小游(导览讲解) 中推荐一个最适配的智能体名"}';

function extractJson(raw: string): EmotionResult | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    const battery = Number(parsed.battery);
    return {
      moodLabel: String(parsed.moodLabel ?? "平静"),
      keywords: Array.isArray(parsed.keywords)
        ? parsed.keywords.map(String).slice(0, 5)
        : [],
      battery: Number.isFinite(battery)
        ? Math.max(0, Math.min(100, Math.round(battery)))
        : 50,
      advice: String(parsed.advice ?? ""),
      recommendAgent: String(parsed.recommendAgent ?? "慢慢"),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: EmotionRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "请先和宁宁聊聊吧" }, { status: 400 });
  }

  const messages: SparkMessage[] = [
    { role: "system", content: AGENT_PERSONAS.ningning.systemPrompt },
    { role: "user", content: `${ANALYSIS_PROMPT}\n\n用户的话：${text}` },
  ];

  try {
    const raw = await sparkChat(messages, { temperature: 0.4 });
    const result = extractJson(raw);
    if (!result) return NextResponse.json(localEmotionResult(text));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(localEmotionResult(text));
  }
}
