import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GitBranch, MapPin } from "lucide-react";
import { Nav } from "@/components/layout/nav";
import { MAP_POIS } from "@/lib/map/pois";
import { MOCK_ROUTES } from "@/lib/map/routes";
import { KnowledgeGraph } from "@/components/culture/knowledge-graph";

export const metadata: Metadata = {
  title: "项目原理与数据说明 | 宁可慢一点",
  description: "了解宁可慢一点的路线规划方法、数据范围与当前能力边界。",
};

const steps = [
  ["01", "理解需求"],
  ["02", "计算路网"],
  ["03", "约束求解"],
  ["04", "生成路线"],
];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-28 md:px-10 md:pt-32">
        <section className="max-w-3xl">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Method & Data
          </p>
          <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-ink md:text-5xl">
            路线如何生成，数据从哪里来
          </h1>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="数据概览">
          {[
            [String(MAP_POIS.length), "文旅地点"],
            [String(MOCK_ROUTES.length), "经典路线"],
            ["2–5", "单次规划地点"],
            ["3", "算法对照组"],
          ].map(([value, label]) => (
            <div key={label} className="glass-strong rounded-3xl p-5 shadow-m">
              <p className="font-serif text-3xl font-semibold text-primary">{value}</p>
              <p className="mt-1 text-sm text-rock">{label}</p>
            </div>
          ))}
        </section>

        <KnowledgeGraph />

        <section className="mt-16">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-2xl font-semibold text-ink">规划流程</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {steps.map(([index, title]) => (
              <article key={index} className="rounded-3xl border border-white/70 bg-white/55 p-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-gold">{index}</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-col gap-4 rounded-3xl bg-ink px-6 py-8 text-paper md:flex-row md:items-center md:justify-between md:px-9">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" />
              <h2 className="font-serif text-2xl font-semibold">亲自比较两条路线</h2>
            </div>
          </div>
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 self-start rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-white md:self-auto"
          >
            开始智能规划
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </>
  );
}
