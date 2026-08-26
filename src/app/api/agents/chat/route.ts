import { NextResponse } from "next/server";
import { getPersona } from "@/lib/agents/personas";
import { localAgentReply } from "@/lib/agents/local-fallback";
import { sparkChat, type SparkMessage } from "@/lib/spark/client";

interface ChatRequestBody {
  agentId?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 });
  }

  const persona = getPersona(body.agentId ?? "");
  if (!persona) {
    return NextResponse.json({ error: "未知的智能体" }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter((m) => m.content?.trim())
    .slice(-12);

  if (history.length === 0) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  const messages: SparkMessage[] = [
    { role: "system", content: persona.systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const fallback = localAgentReply(persona.id, lastUser?.content ?? "");

  try {
    const reply = await sparkChat(messages, { temperature: 0.8 });
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: fallback, fallback: true });
  }
}
