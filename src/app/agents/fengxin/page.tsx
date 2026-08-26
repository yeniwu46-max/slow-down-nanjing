import { Nav } from "@/components/layout/nav";
import { AgentHero } from "@/components/agents/agent-hero";
import { FengxinStudio } from "@/components/agents/fengxin-studio";
import { AGENT_PERSONAS } from "@/lib/agents/personas";

export const metadata = {
  title: "风信 · 文案生成 | 宁可慢一点",
};

const persona = AGENT_PERSONAS.fengxin;

export default function FengxinPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-20 md:px-10 md:pt-24">
        <AgentHero persona={persona} />
        <FengxinStudio persona={persona} />
      </main>
    </>
  );
}
