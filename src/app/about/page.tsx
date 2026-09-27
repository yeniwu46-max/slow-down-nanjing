import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, GitBranch, MapPin, ShieldCheck } from "lucide-react";
import { Nav } from "@/components/layout/nav";
import { MAP_POIS } from "@/lib/map/pois";
import { MOCK_ROUTES } from "@/lib/map/routes";
import { KnowledgeGraph } from "@/components/culture/knowledge-graph";
import { cultureGraphStats } from "@/lib/culture/graph";

export const metadata: Metadata = {
  title: "项目原理与数据说明 | 宁可慢一点",
  description: "了解宁可慢一点的路线规划方法、数据范围与当前能力边界。",
};

const steps = [
  ["01", "选择地点", "从南京文旅地点中选择 2 至 5 处，组成一次规划任务。"],
  ["02", "读取步行路网", "从 Valhalla / OpenStreetMap 离线矩阵读取地点间真实步行时长与距离。"],
  ["03", "硬约束求解", "计算开放时间窗、停留与等待，保证闭馆前完成且总时间不超过预算。"],
  ["04", "对照与解释", "同时比较基准、智能与精确最优路线，并展示文化、天气和取舍依据。"],
];

export default function AboutPage() {
  const graphStats = cultureGraphStats();
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
          <p className="mt-5 text-base leading-8 text-rock md:text-lg">
            “宁可慢一点”不是随机推荐路线。当前版本以南京核心文旅地点、离线文化知识图谱和
            Valhalla 步行路网矩阵为基础，对效率、体验与文化目标进行可复现的本地计算。
          </p>
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
            {steps.map(([index, title, description]) => (
              <article key={index} className="rounded-3xl border border-white/70 bg-white/55 p-6">
                <p className="text-xs font-semibold tracking-[0.18em] text-gold">{index}</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-rock">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <article className="glass-strong rounded-3xl p-6 shadow-m md:p-8">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="font-serif text-2xl font-semibold text-ink">当前数据范围</h2>
            </div>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-rock">
              <li>· 地点数据增加建议停留时间、文化标签、室内外、体力、雨天、休息、无障碍与来源字段。</li>
              <li>· 道路边记录步行时间、景观、遮阴避雨、拥挤、体力与夜间适宜性六项指标。</li>
              <li>· 23×23 步行矩阵包含 529 个地点对，记录 Valhalla 版本、生成时间、坐标哈希与 OpenStreetMap 署名。</li>
              <li>· 场馆开放时间为带来源说明的演示样本；临时关闭状态由当前规划条件传入。</li>
              <li>· 经典路线为策划团队整理的南京慢游示例，用于浏览和对照。</li>
              <li>· 每条推荐路线均显示数据更新时间和计算耗时；规划在浏览器本地完成。</li>
              <li>· 文化层使用离线 JSON-LD，当前包含 {graphStats.entities} 个实体、{graphStats.claims} 条关系和 {graphStats.sources} 项来源记录。</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-gold/25 bg-gold/10 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <h2 className="font-serif text-2xl font-semibold text-ink">能力边界</h2>
            </div>
            <p className="mt-5 text-sm leading-7 text-rock">
              POI 间步行时间与距离来自离线路网快照，地图折线和景观评分仍使用项目道路图；用户临时定位到首站为估算接入段。
              拥挤、体力与舒适度是项目演示样本，并非实时监测。暂未接入实时路况、实时客流和场馆开放状态，
              因此不会生成无数据支撑的“实时拥堵”结论。
              路线结果用于文旅慢游方案比较，不替代正式导航与现场安全指引。
            </p>
          </article>
        </section>

        <section className="mt-16 flex flex-col gap-4 rounded-3xl bg-ink px-6 py-8 text-paper md:flex-row md:items-center md:justify-between md:px-9">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" />
              <h2 className="font-serif text-2xl font-semibold">亲自比较两条路线</h2>
            </div>
            <p className="mt-2 text-sm text-paper/70">选择地点后，查看不同规划目标如何改变路线。</p>
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
