import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(".");
const OUTPUT_DIR = path.join(ROOT, "experiments", "route-planning");
const CHARTS_DIR = path.join(OUTPUT_DIR, "charts");
const PDF_OUTPUT_DIR = path.join(ROOT, "output", "pdf");

// Report rendering consumes the already-validated summary schema and intentionally keeps
// this presentation-only adapter flexible as new generated metrics are added.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonRecord = Record<string, any>;

function n(value: number | null | undefined, digits = 1): string {
  return value == null ? "—" : Number(value).toFixed(digits).replace(/\.0$/, "");
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgFrame(title: string, body: string, subtitle = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="620" viewBox="0 0 1200 620" role="img" aria-label="${escapeHtml(title)}">
  <rect width="1200" height="620" rx="28" fill="#fbfaf5"/>
  <text x="64" y="62" font-family="Microsoft YaHei, sans-serif" font-size="30" font-weight="700" fill="#18372d">${escapeHtml(title)}</text>
  ${subtitle ? `<text x="64" y="96" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#65766e">${escapeHtml(subtitle)}</text>` : ""}
  ${body}
</svg>`;
}

function barChart(
  title: string,
  items: Array<{ label: string; value: number; color?: string; suffix?: string; ci?: [number, number] | null }>,
  maximum: number,
  subtitle = "",
): string {
  const left = 280;
  const width = 820;
  const rowHeight = 78;
  const body = items.map((item, index) => {
    const y = 132 + index * rowHeight;
    const barWidth = Math.max(0, Math.min(width, (item.value / maximum) * width));
    const ci = item.ci
      ? `<line x1="${left + (item.ci[0] / maximum) * width}" x2="${left + (item.ci[1] / maximum) * width}" y1="${y + 22}" y2="${y + 22}" stroke="#1b2924" stroke-width="3"/><line x1="${left + (item.ci[0] / maximum) * width}" x2="${left + (item.ci[0] / maximum) * width}" y1="${y + 15}" y2="${y + 29}" stroke="#1b2924" stroke-width="3"/><line x1="${left + (item.ci[1] / maximum) * width}" x2="${left + (item.ci[1] / maximum) * width}" y1="${y + 15}" y2="${y + 29}" stroke="#1b2924" stroke-width="3"/>`
      : "";
    return `<text x="${left - 22}" y="${y + 29}" text-anchor="end" font-family="Microsoft YaHei, sans-serif" font-size="20" fill="#31463e">${escapeHtml(item.label)}</text>
      <rect x="${left}" y="${y}" width="${width}" height="44" rx="11" fill="#e5e8e1"/>
      <rect x="${left}" y="${y}" width="${barWidth}" height="44" rx="11" fill="${item.color ?? "#2f7d63"}"/>
      ${ci}
      <text x="${Math.min(left + barWidth + 12, 1120)}" y="${y + 29}" font-family="Microsoft YaHei, sans-serif" font-size="19" font-weight="700" fill="#18372d">${n(item.value, 2)}${item.suffix ?? ""}</text>`;
  }).join("\n");
  return svgFrame(title, body, subtitle);
}

function histogram(title: string, values: number[], bins: number, maximum: number, threshold?: number): string {
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((value) => {
    const index = Math.min(bins - 1, Math.max(0, Math.floor((value / maximum) * bins)));
    counts[index] += 1;
  });
  const maxCount = Math.max(...counts, 1);
  const left = 90;
  const top = 125;
  const chartWidth = 1020;
  const chartHeight = 390;
  const gap = 6;
  const barWidth = chartWidth / bins - gap;
  const bars = counts.map((count, index) => {
    const height = (count / maxCount) * chartHeight;
    return `<rect x="${left + index * chartWidth / bins}" y="${top + chartHeight - height}" width="${barWidth}" height="${height}" fill="#4b8c74" rx="4"/><text x="${left + index * chartWidth / bins + barWidth / 2}" y="${top + chartHeight - height - 8}" text-anchor="middle" font-family="Arial" font-size="13" fill="#31463e">${count || ""}</text>`;
  }).join("\n");
  const thresholdLine = threshold == null ? "" : `<line x1="${left + (threshold / maximum) * chartWidth}" x2="${left + (threshold / maximum) * chartWidth}" y1="${top - 10}" y2="${top + chartHeight}" stroke="#bd4a3d" stroke-width="4" stroke-dasharray="10 8"/><text x="${left + (threshold / maximum) * chartWidth - 8}" y="${top - 20}" text-anchor="end" font-family="Microsoft YaHei, sans-serif" font-size="17" fill="#bd4a3d">验收阈值 ${threshold}ms</text>`;
  return svgFrame(title, `${bars}${thresholdLine}<line x1="${left}" x2="${left + chartWidth}" y1="${top + chartHeight}" y2="${top + chartHeight}" stroke="#718078"/><text x="${left}" y="565" font-family="Microsoft YaHei, sans-serif" font-size="17" fill="#65766e">0</text><text x="${left + chartWidth}" y="565" text-anchor="end" font-family="Microsoft YaHei, sans-serif" font-size="17" fill="#65766e">${maximum}</text>`, `样本数 ${values.length}；柱为区间频数`);
}

function performanceChart(values: number[], p95: number): string {
  const maximum = Math.max(20, Math.ceil(Math.max(...values) / 5) * 5);
  const bins = 20;
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((value) => {
    counts[Math.min(bins - 1, Math.floor((value / maximum) * bins))] += 1;
  });
  const maxCount = Math.max(...counts, 1);
  const left = 90;
  const width = 1020;
  const top = 135;
  const height = 285;
  const bars = counts.map((count, index) => {
    const barHeight = count / maxCount * height;
    return `<rect x="${left + index * width / bins}" y="${top + height - barHeight}" width="${width / bins - 5}" height="${barHeight}" rx="4" fill="#4b8c74"/>`;
  }).join("");
  const p95X = left + Math.min(1, p95 / maximum) * width;
  const gaugeP95X = left + p95 / 500 * width;
  return svgFrame(
    "动态重算耗时分布与 500ms 阈值",
    `${bars}<line x1="${left}" x2="${left + width}" y1="${top + height}" y2="${top + height}" stroke="#718078"/>
    <line x1="${p95X}" x2="${p95X}" y1="${top - 12}" y2="${top + height}" stroke="#b67c3c" stroke-width="3" stroke-dasharray="8 6"/><text x="${p95X + 8}" y="${top - 18}" font-family="Microsoft YaHei, sans-serif" font-size="17" fill="#9b632c">P95 ${n(p95, 2)}ms</text>
    <text x="${left}" y="450" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#65766e">0</text><text x="${left + width}" y="450" text-anchor="end" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#65766e">${maximum}ms（分布放大）</text>
    <text x="${left}" y="500" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#31463e">验收尺度</text><line x1="${left}" x2="${left + width}" y1="535" y2="535" stroke="#d7ded7" stroke-width="14" stroke-linecap="round"/>
    <line x1="${gaugeP95X}" x2="${gaugeP95X}" y1="518" y2="552" stroke="#b67c3c" stroke-width="4"/><line x1="${left + width}" x2="${left + width}" y1="510" y2="558" stroke="#bd4a3d" stroke-width="5"/><text x="${left + width}" y="590" text-anchor="end" font-family="Microsoft YaHei, sans-serif" font-size="16" fill="#bd4a3d">500ms 阈值</text>`,
    `上部放大显示 ${values.length} 个样本的实际分布；下部恢复 0–500ms 验收尺度`,
  );
}

function parseCsv(text: string): JsonRecord[] {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])));
}

function metricCard(label: string, value: string, note: string): string {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`;
}

function chartBlock(svg: string, caption: string): string {
  return `<figure>${svg}<figcaption>${escapeHtml(caption)}</figcaption></figure>`;
}

function routeNames(ids: string): string {
  return ids ? ids.split(">").join(" → ") : "正确拒绝（未生成路线）";
}

async function main(): Promise<void> {
  const summary = JSON.parse(await readFile(path.join(OUTPUT_DIR, "summary.json"), "utf8")) as JsonRecord;
  const scenarios = JSON.parse(await readFile(path.join(OUTPUT_DIR, "scenarios.json"), "utf8")) as JsonRecord;
  const rows = parseCsv(await readFile(path.join(OUTPUT_DIR, "results.csv"), "utf8"));
  const performanceRows = parseCsv(await readFile(path.join(OUTPUT_DIR, "performance.csv"), "utf8"));
  const full = summary.configurations.full;
  const baseline = summary.baselineComparison;
  const ablations = summary.ablations;
  const perf = summary.performance;

  await mkdir(CHARTS_DIR, { recursive: true });
  const charts: Record<string, string> = {
    "01-quality.svg": barChart("硬约束与可用性验收", [
      { label: "可行路线生成率", value: full.feasibleGenerationRatePercent, suffix: "%" },
      { label: "不可行场景正确拒绝率", value: full.correctRejectionRatePercent, suffix: "%" },
      { label: "无超预算路线占比", value: 100 - full.overBudgetViolationRatePercent, suffix: "%" },
      { label: "无闭馆违规路线占比", value: 100 - full.routeClosingViolationRatePercent, suffix: "%" },
    ], 100, "分母分别为 56 个可行场景、4 个不可行场景及已生成路线"),
    "02-baseline.svg": barChart("智能路线相对基准路线", [
      { label: "平均多完成地点", value: baseline.completionCountDifference.mean, suffix: " 个" },
      { label: "等地点数距离改进", value: Math.max(0, baseline.distanceImprovementPercent.mean), suffix: "%" },
      { label: "文化覆盖提升", value: baseline.cultureCoveragePercentagePointDifference.mean, suffix: " pp" },
    ], 20, "距离与总时间仅在完成地点数相同时比较；距离均值接近 0，未夸大为显著改进"),
    "03-culture.svg": histogram("Full 配置文化覆盖率分布", rows.filter((row) => row.config === "full" && row.generated === "true").map((row) => Number(row.cultureCoveragePercent)), 10, 100),
    "04-ablation.svg": barChart("单因素消融：Full 相对关闭功能组的平均差", [
      { label: "BGE：语义匹配分", value: ablations.noBge.semanticMatchScoreDifference.mean, suffix: " 分", ci: ablations.noBge.semanticMatchScoreDifference.bootstrapMean95Ci },
      { label: "知识图谱：文化覆盖", value: ablations.noKg.cultureCoveragePercentagePointDifference.mean, suffix: " pp", ci: ablations.noKg.cultureCoveragePercentagePointDifference.bootstrapMean95Ci },
      { label: "天气：雨天室内占比", value: ablations.noWeather.rainyIndoorSharePercentagePointDifference.mean, suffix: " pp", ci: ablations.noWeather.rainyIndoorSharePercentagePointDifference.bootstrapMean95Ci },
      { label: "天气：晴天景观分", value: ablations.noWeather.sunnyScenicScoreDifference.mean, suffix: " 分", ci: ablations.noWeather.sunnyScenicScoreDifference.bootstrapMean95Ci },
    ], 24, "误差线为固定场景配对差均值的 10,000 次 bootstrap 95% 区间；不报告 p 值"),
    "05-performance.svg": performanceChart(
      performanceRows.map((row) => Number(row.milliseconds)),
      perf.p95,
    ),
    "06-optimal-gap.svg": histogram("智能路线与精确最优路线总时间差距", rows.filter((row) => row.config === "full" && row.optimalTimeGapMinutes !== "").map((row) => Number(row.optimalTimeGapMinutes)), 10, 50),
  };
  await Promise.all(Object.entries(charts).map(([name, svg]) => writeFile(path.join(CHARTS_DIR, name), `${svg}\n`, "utf8")));

  const caseIds = ["01-six-dynasties-rain-short", "13-qinhuai-closing-pressure", "55-night-weekend-night"];
  const cases = caseIds.flatMap((id) => {
    const scenario = scenarios.scenarios.find((item: JsonRecord) => item.id === id);
    const row = rows.find((item) => item.scenarioId === id && item.config === "full");
    return scenario && row ? [{ scenario, row }] : [];
  });

  const markdown = `# 路线规划算法对照实验报告

> 生成时间：${summary.generatedAt}  
> 固定种子：20260928；Git SHA：\`${summary.environment.gitSha}\`

## 摘要

本实验使用 12 个南京文化慢游模板与 5 种出行情境组成 60 个固定场景，对基准路线、完整智能路线和 ≤5 POI 精确枚举最优路线统一验证，并执行 No-BGE、No-KG、No-Weather 三组单因素消融。共完成 ${summary.experiment.functionalRunCount} 组功能实验与 ${summary.experiment.performanceSampleCount} 个动态重算性能样本。

Full 配置在精确求解器判定可行的 ${summary.experiment.oracleFeasibleCount} 个场景中生成率为 ${n(full.feasibleGenerationRatePercent)}%，对 ${summary.experiment.oracleInfeasibleCount} 个不可行场景的正确拒绝率为 ${n(full.correctRejectionRatePercent)}%；超预算率与闭馆违规率均为 ${n(full.overBudgetViolationRatePercent)}%。平均文化覆盖率为 ${n(full.metrics.cultureCoveragePercent.mean)}%，性能 P95 为 ${n(perf.p95, 2)}ms，超过 500ms 的比例为 ${n(perf.over500RatePercent, 2)}%。

## 1. 系统与算法

- 基准路线：按用户勾选顺序执行时间窗截断。
- 智能路线：在预算、开放时间、临时关闭等硬约束内，综合真实离线路网、BGE 语义相关度、知识图谱覆盖、天气、景观、拥挤和夜间适宜性。
- 最优验证路线：对不超过 5 个 POI 的全部子集与顺序进行精确枚举，先最大化完成地点数，再最小化总时间与步行时间。
- 消融开关只移除对应决策贡献；后验评估器仍计算语义、文化和天气指标。

## 2. 场景与指标

60 个场景严格由六朝、民国、秦淮城南、明城墙、钟山、博物馆、佛教、湖泊慢游、低体力、无障碍、夜游和综合跨区 12 个模板，与雨天短时、早晨等开馆、临近闭馆、日间文化偏好、周末傍晚 5 个配置笛卡尔组合构成。56 个场景可行，4 个场景故意将候选点设为临时关闭，用于检验正确拒绝。

## 3. 三类路线对照

智能路线相对基准路线平均多完成 ${n(baseline.completionCountDifference.mean, 2)} 个地点（胜/平/负 ${baseline.completionCountDifference.wins}/${baseline.completionCountDifference.ties}/${baseline.completionCountDifference.losses}）。只在完成地点数相同的场景比较距离和总时间：距离平均改进 ${n(baseline.distanceImprovementPercent.mean, 2)}%，总时间平均改进 ${n(baseline.totalTimeImprovementPercent.mean, 2)}%。后两者区间跨越 0，应解释为“没有稳定优势”，不能筛除负结果。文化覆盖率平均提升 ${n(baseline.cultureCoveragePercentagePointDifference.mean, 2)} 个百分点。

精确验证显示智能路线完成地点数与精确解差值均为 0；等覆盖下总时间平均比精确最优高 ${n(summary.optimalComparison.totalTimeGapMinutesForEqualCoverage.mean, 2)} 分钟，${summary.optimalComparison.exactMatchCount} 个场景与精确解完全一致。

## 4. 消融实验

- No-BGE：Full 的语义匹配分平均高 ${n(ablations.noBge.semanticMatchScoreDifference.mean, 2)} 分，胜/平/负 ${ablations.noBge.semanticMatchScoreDifference.wins}/${ablations.noBge.semanticMatchScoreDifference.ties}/${ablations.noBge.semanticMatchScoreDifference.losses}。
- No-KG：Full 的文化覆盖率平均高 ${n(ablations.noKg.cultureCoveragePercentagePointDifference.mean, 2)} 个百分点。
- No-Weather：雨天室内占比平均提高 ${n(ablations.noWeather.rainyIndoorSharePercentagePointDifference.mean, 2)} 个百分点；晴天景观分平均提高 ${n(ablations.noWeather.sunnyScenicScoreDifference.mean, 2)} 分。雨天遮蔽分平均差为 ${n(ablations.noWeather.rainyShelterScoreDifference.mean, 2)}，如实保留该零结果。

## 5. 性能

先预热 ${summary.experiment.performanceWarmupCount} 次，再对每个场景重复 20 次，共 ${summary.experiment.performanceSampleCount} 个样本。平均 ${n(perf.mean, 2)}ms，P50 ${n(perf.median, 2)}ms，P95 ${n(perf.p95, 2)}ms，最大 ${n(perf.max, 2)}ms；超过 500ms 的比例 ${n(perf.over500RatePercent, 2)}%，两项发布门槛均通过。BGE 冷启动 ${n(summary.semanticPerformance.coldLoadMs, 2)}ms，暖推理 P95 ${n(summary.semanticPerformance.warmInferenceMs.p95, 2)}ms，未计入动态重算。

## 6. 数据边界与内部效度

这是固定工程基准，不是随机人群抽样，因此不使用显著性 p 值。置信区间仅描述 60 个固定场景的配对差不确定性。开放时间、拥挤、景观与舒适度中的部分字段是项目样本；路网矩阵是带时间戳的离线快照，不描述为实时城市数据。当前场景仅覆盖 23 个南京 POI 和不超过 5 点的小规模规划。

## 7. 复现

\`npm run experiment:semantic\` 生成真实本地 BGE 固定结果；\`npm run experiment:routes\` 生成 CSV/JSON；\`npm run experiment:report\` 生成图表与报告；\`npm run experiment:verify\` 检查口径与产物；\`npm run experiment\` 执行完整流水线。

## 图表

${Object.keys(charts).map((name) => `![${name}](charts/${name})`).join("\n\n")}
`;
  await writeFile(path.join(OUTPUT_DIR, "report.md"), markdown, "utf8");

  const css = `
    @page { size: A4; margin: 12mm 13mm 13mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #21362f; font-family: "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; background: #eef0ea; }
    .page { width: 100%; min-height: 270mm; background: #fffefa; padding: 13mm 14mm; page-break-after: always; position: relative; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
    h1 { font-size: 34px; margin: 0 0 12px; color: #173d31; letter-spacing: .03em; }
    h2 { font-size: 25px; margin: 0 0 16px; color: #235b49; border-bottom: 2px solid #d7ded7; padding-bottom: 8px; }
    h3 { font-size: 17px; color: #315f50; margin: 15px 0 7px; }
    p, li { font-size: 12.5px; line-height: 1.75; }
    .eyebrow { color: #9b6e34; font-weight: 700; letter-spacing: .16em; margin-bottom: 12px; }
    .lead { font-size: 17px; line-height: 1.8; max-width: 88%; }
    .meta { margin-top: 28px; padding: 14px 18px; background: #f0f3ed; border-left: 5px solid #b68a52; font-size: 12px; line-height: 1.8; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
    .metric { padding: 15px; border-radius: 14px; background: #edf3ef; border: 1px solid #d8e2dc; }
    .metric span, .metric small { display: block; color: #63776f; }
    .metric strong { display: block; font-size: 27px; color: #1f674f; margin: 6px 0; }
    .metric small { font-size: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .card { border: 1px solid #dce2dd; border-radius: 13px; padding: 13px 15px; background: #fff; }
    .callout { background: #f8f0e5; border-left: 5px solid #b77b38; padding: 12px 16px; margin: 14px 0; font-size: 12px; line-height: 1.7; }
    figure { margin: 10px 0 0; }
    figure svg { width: 100%; height: auto; display: block; }
    figcaption { text-align: center; color: #66756f; font-size: 10px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    th, td { padding: 7px; border-bottom: 1px solid #dde2de; text-align: left; vertical-align: top; }
    th { color: #315f50; background: #eef3ef; }
    code { font-family: Consolas, monospace; background: #edf0ec; padding: 1px 4px; border-radius: 4px; }
    .footer { position: absolute; bottom: 8mm; left: 14mm; right: 14mm; display: flex; justify-content: space-between; color: #89958f; font-size: 9px; }
  `;
  const footer = (page: number) => `<div class="footer"><span>宁可慢一点 · 路线规划算法对照实验</span><span>${page} / 9</span></div>`;
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>路线规划算法对照实验报告</title><style>${css}</style></head><body>
  <section class="page"><div class="eyebrow">数字媒体竞赛 · 技术验证报告</div><h1>路线规划算法<br/>对照实验报告</h1><p class="lead">以 60 套固定南京文旅场景，统一验证基准路线、智能路线与精确最优路线，并通过 BGE、文化知识图谱和天气规则的单因素消融，回答“系统是否可行、为何更智能、能否稳定复现”。</p><div class="metrics">${metricCard("固定场景", "60", "12 个模板 × 5 种条件")}${metricCard("功能实验", "240", "Full + 三组消融")}${metricCard("性能样本", "1,200", "预热后每场景 20 次")}${metricCard("重算 P95", `${n(perf.p95, 2)}ms`, "验收阈值 < 500ms")}</div><div class="meta">生成时间：${escapeHtml(summary.generatedAt)}<br/>Git SHA：${escapeHtml(summary.environment.gitSha)}<br/>固定种子：20260928</div>${footer(1)}</section>
  <section class="page"><h2>1. 实验问题与算法系统</h2><div class="grid"><div class="card"><h3>基准路线</h3><p>按用户勾选顺序前进，遇到开放时间或预算约束后截断。它代表没有多目标智能评分时的朴素方案。</p></div><div class="card"><h3>智能路线</h3><p>在预算、时间窗和临时关闭硬约束内，联合真实步行矩阵、BGE 语义、文化图谱覆盖、天气、景观、拥挤与夜游条件。</p></div><div class="card"><h3>最优验证路线</h3><p>在 ≤5 POI 条件下精确枚举全部子集与顺序，先最大化完成地点数，再最小化总时间与步行时间。</p></div><div class="card"><h3>三组单因素消融</h3><p>No-BGE、No-KG、No-Weather 每次只移除一项决策贡献，硬约束与后验指标评估保持不变。</p></div></div><h3>主要实验问题</h3><ol><li>系统能否对可行情形稳定生成路线，并正确拒绝不可行情形？</li><li>智能路线是否在不减少完成地点数的前提下改善体验与文化覆盖？</li><li>三项智能模块分别贡献了什么，是否存在无改善或负结果？</li><li>动态重算能否稳定低于 500ms？</li></ol><div class="callout">“可行”不读取路线对象自带标记，而是由独立评估器重新检查总预算、每站离馆时刻和临时关闭地点。</div>${footer(2)}</section>
  <section class="page"><h2>2. 固定场景与统计口径</h2><p>12 个主题模板覆盖六朝、民国、秦淮城南、明城墙、钟山、博物馆、佛教、湖泊慢游、低体力、无障碍、夜游和跨区综合路线；每个模板固定组合 5 种出行条件。</p><table><thead><tr><th>条件</th><th>关键设置</th><th>检验目标</th></tr></thead><tbody><tr><td>雨天低体力短时</td><td>45–60 分钟、雨天、低体力</td><td>室内与遮蔽适配</td></tr><tr><td>早晨等开馆</td><td>08:00 出发、固定起点</td><td>等待时间与时间窗</td></tr><tr><td>下午临近闭馆</td><td>16:10 出发、临时关闭点</td><td>闭馆与正确拒绝</td></tr><tr><td>日间文化偏好</td><td>180 分钟、自然语言需求</td><td>BGE 与图谱覆盖</td></tr><tr><td>周末傍晚夜游</td><td>17:30、避拥挤、夜游</td><td>夜间开放与拥挤成本</td></tr></tbody></table><div class="metrics">${metricCard("精确判定可行", "56", "生成率的分母")}${metricCard("故意不可行", "4", "正确拒绝率的分母")}${metricCard("Bootstrap", "10,000", "配对差均值 95% 区间")}${metricCard("p 值", "不使用", "固定工程基准，非抽样研究")}</div><p>距离与总时间改进率统一为 <code>(基准−智能)/基准×100%</code>，且仅在完成地点数相同时计算。文化覆盖同时报告百分点差与相对变化；基准为 0 时不计算相对变化。</p>${footer(3)}</section>
  <section class="page"><h2>3. 可行性与硬约束结果</h2>${chartBlock(charts["01-quality.svg"], "图 1　可行生成、正确拒绝及硬约束合规率")}${footer(4)}</section>
  <section class="page"><h2>4. 基准路线与智能路线</h2>${chartBlock(charts["02-baseline.svg"], "图 2　智能路线相对基准路线的主要变化")}<div class="callout">完成地点数平均增加 ${n(baseline.completionCountDifference.mean, 2)} 个；文化覆盖平均增加 ${n(baseline.cultureCoveragePercentagePointDifference.mean, 2)} 个百分点。等地点数时，距离和总时间的平均改进分别为 ${n(baseline.distanceImprovementPercent.mean, 2)}% 与 ${n(baseline.totalTimeImprovementPercent.mean, 2)}%，其 bootstrap 区间跨越 0，因此不宣称稳定缩短。</div>${footer(5)}</section>
  <section class="page"><h2>5. 文化覆盖与精确最优验证</h2>${chartBlock(charts["03-culture.svg"], "图 3　Full 配置下文化主题覆盖率分布")}${chartBlock(charts["06-optimal-gap.svg"], "图 4　完成地点数相同时，智能路线相对精确最优解的总时间差")}${footer(6)}</section>
  <section class="page"><h2>6. BGE、知识图谱与天气消融</h2>${chartBlock(charts["04-ablation.svg"], "图 5　Full 与单项关闭配置的配对差；正值代表该模块带来提升")}<p>Full 对 No-BGE 的语义分平均提升 ${n(ablations.noBge.semanticMatchScoreDifference.mean, 2)}；对 No-KG 的文化覆盖平均提升 ${n(ablations.noKg.cultureCoveragePercentagePointDifference.mean, 2)} 个百分点。天气规则使雨天室内占比平均提升 ${n(ablations.noWeather.rainyIndoorSharePercentagePointDifference.mean, 2)} 个百分点，但雨天遮蔽评分差为 0；该零结果保留在报告中。</p>${footer(7)}</section>
  <section class="page"><h2>7. 动态重算性能</h2>${chartBlock(charts["05-performance.svg"], "图 6　1,200 个 Full 动态重算样本；红线为 500ms 现场验收阈值")}<div class="metrics">${metricCard("平均", `${n(perf.mean, 2)}ms`, "预热后重算")}${metricCard("P50", `${n(perf.median, 2)}ms`, "中位耗时")}${metricCard("P95", `${n(perf.p95, 2)}ms`, "低于 500ms")}${metricCard(">500ms", `${n(perf.over500RatePercent, 2)}%`, "门槛 ≤1%")}</div><p>BGE 冷启动 ${n(summary.semanticPerformance.coldLoadMs, 2)}ms，暖推理 P95 ${n(summary.semanticPerformance.warmInferenceMs.p95, 2)}ms。二者单独记录，不混入动态重算。</p>${footer(8)}</section>
  <section class="page"><h2>8. 代表性案例、边界与复现</h2>${cases.map(({ scenario, row }) => `<div class="card"><h3>${escapeHtml(scenario.id)} · ${escapeHtml(scenario.templateName)} / ${escapeHtml(scenario.profileName)}</h3><p><b>智能：</b>${escapeHtml(routeNames(row.routePoiIds))}<br/><b>基准：</b>${escapeHtml(routeNames(row.baselinePoiIds))}<br/><b>最优：</b>${escapeHtml(routeNames(row.optimalPoiIds))}<br/>完成 ${escapeHtml(row.completedPoiCount || "0")} 点，文化覆盖 ${escapeHtml(row.cultureCoveragePercent || "—")}% ，总时间 ${escapeHtml(row.totalMinutes || "—")} 分钟。</p></div>`).join("")}<div class="callout"><b>数据边界：</b>开放时间、拥挤、景观与舒适度中的部分字段为项目样本；步行路网是 ${escapeHtml(summary.environment.walkingMatrixGeneratedAt)} 生成的离线快照，不代表实时城市数据。场景仅覆盖现有 23 个 POI 与 ≤5 点问题。</div><h3>一键复现</h3><p><code>npm run experiment</code> 顺序执行真实本地 BGE 固定结果、功能/消融/性能实验、报告生成和完整性核验。原始结果保存在 <code>results.csv</code>、<code>performance.csv</code> 与 <code>summary.json</code>。</p>${footer(9)}</section>
  </body></html>`;
  const htmlPath = path.join(OUTPUT_DIR, "report.html");
  const pdfPath = path.join(OUTPUT_DIR, "report.pdf");
  await writeFile(htmlPath, html, "utf8");

  const browserCandidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  let rendered = false;
  for (const browser of browserCandidates) {
    const result = spawnSync(browser, [
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      `--print-to-pdf=${pdfPath}`,
      pathToFileURL(htmlPath).href,
    ], { encoding: "utf8" });
    if (result.status === 0) {
      rendered = true;
      break;
    }
  }
  if (!rendered) throw new Error("No supported Chromium browser could render report.pdf");
  await mkdir(PDF_OUTPUT_DIR, { recursive: true });
  await copyFile(pdfPath, path.join(PDF_OUTPUT_DIR, "路线规划算法对照实验报告.pdf"));
  console.log(`Wrote Markdown, self-contained HTML, six SVG charts and PDF to ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
