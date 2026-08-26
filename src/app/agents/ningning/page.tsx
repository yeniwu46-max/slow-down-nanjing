import { Suspense } from "react";
import { Nav } from "@/components/layout/nav";
import { AgentHero } from "@/components/agents/agent-hero";
import { NingningCompanion } from "@/components/agents/ningning-companion";
import { AGENT_PERSONAS } from "@/lib/agents/personas";

export const metadata = {
  title: "宁宁 · 慢行陪伴 | 宁可慢一点",
};

const persona = AGENT_PERSONAS.ningning;

function NingningFallback() {
  return (
    <div className="mt-6 flex h-[60vh] min-h-[460px] items-center justify-center rounded-3xl bg-white/70 text-sm text-rock">
      加载对话中…
    </div>
  );
}

export default function NingningPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-20 md:px-10 md:pt-24">
        <AgentHero persona={persona} />
        <Suspense fallback={<NingningFallback />}>
          <NingningCompanion persona={persona} />
        </Suspense>
      </main>
    </>
  );
}
