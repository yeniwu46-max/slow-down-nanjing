import { Nav } from "@/components/layout/nav";
import { AgentHero } from "@/components/agents/agent-hero";
import { ChatWindow } from "@/components/agents/chat-window";
import { AGENT_PERSONAS } from "@/lib/agents/personas";

export const metadata = {
  title: "金陵小游 · 导览讲解 | 宁可慢一点",
};

const persona = AGENT_PERSONAS.jinling;

export default function JinlingPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-20 md:px-10 md:pt-24">
        <AgentHero persona={persona} />
        <ChatWindow
          persona={persona}
          className="mt-6 h-[60vh] min-h-[460px]"
          welcome="我是金陵小游。想听梧桐、玄武湖、秦淮还是城墙的故事？慢慢问就好。"
          placeholder="问问金陵的风物与掌故…"
          suggestions={[
            "玄武湖为什么叫玄武？",
            "梧桐大道有什么来历？",
            "明城墙该从哪一段走？",
            "秦淮河白天和夜里有何不同？",
          ]}
        />
      </main>
    </>
  );
}
