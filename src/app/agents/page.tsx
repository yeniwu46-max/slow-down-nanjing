import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Nav } from "@/components/layout/nav";
import { AGENT_LIST } from "@/lib/agents/personas";

export const metadata = {
  title: "金陵伙伴 | 宁可慢一点",
  description: "宁宁、风信、金陵小游——陪你把南京的故事慢慢听完",
};

export default function AgentsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-24 md:px-10">
        <header className="text-center">
          <p className="text-xs font-medium tracking-[0.25em] text-rock">
            金陵 · 慢行伙伴
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal md:text-4xl">
            把这座城的故事，慢慢讲给你听
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-rock md:text-base">
            宁宁听心情，风信写成句子，金陵小游带路。演示请先与金陵小游对话。
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {AGENT_LIST.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl p-6 text-white shadow-m transition-transform duration-300 hover:-translate-y-1.5"
              style={{
                backgroundImage: `linear-gradient(150deg, ${p.accent.from}, ${p.accent.to})`,
              }}
            >
              <span className="absolute -right-6 -top-8 text-9xl leading-none opacity-25 transition-transform duration-500 group-hover:scale-110 select-none">
                {p.emoji}
              </span>
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 text-3xl backdrop-blur">
                {p.emoji}
              </span>
              <h2 className="relative z-10 mt-5 font-serif text-2xl font-semibold">
                {p.name}
              </h2>
              <p className="relative z-10 mt-1 text-sm text-white/85">
                {p.role}
              </p>
              <p className="relative z-10 mt-4 min-h-[2.5rem] text-sm text-white/90">
                {p.tagline}
              </p>
              <p className="relative z-10 mt-4 font-serif text-sm text-white/95">
                「{p.quote}」
              </p>
              <span className="relative z-10 mt-6 inline-flex items-center gap-1 text-sm font-medium">
                开始对话
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
