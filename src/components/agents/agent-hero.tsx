import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AgentPersona } from "@/lib/agents/personas";

export function AgentHero({ persona }: { persona: AgentPersona }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-7 text-white shadow-l md:px-10 md:py-9"
      style={{
        backgroundImage: `linear-gradient(135deg, ${persona.accent.from}, ${persona.accent.to})`,
      }}
    >
      <div className="absolute -right-8 -top-10 text-[10rem] leading-none opacity-20 select-none">
        {persona.emoji}
      </div>
      <Link
        href="/agents"
        className="relative z-10 inline-flex items-center gap-1 text-sm text-white/85 transition-opacity hover:opacity-100"
      >
        <ArrowLeft className="h-4 w-4" /> 返回伙伴
      </Link>
      <div className="relative z-10 mt-4 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-4xl backdrop-blur">
          {persona.emoji}
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold md:text-3xl">
            {persona.name}
          </h1>
          <p className="mt-0.5 text-sm text-white/85">
            {persona.role} · {persona.roleEn}
          </p>
        </div>
      </div>
      <p className="relative z-10 mt-4 max-w-xl font-serif text-base text-white/95 md:text-lg">
        「{persona.quote}」
      </p>
      <div className="relative z-10 mt-3 flex flex-wrap gap-2">
        {persona.traits.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/20 px-3 py-1 text-xs text-white/90 backdrop-blur"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
