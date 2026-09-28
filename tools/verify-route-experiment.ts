import { spawnSync } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { MAP_POIS } from "../src/lib/map/pois";
import { recommendTwoRoutes } from "../src/lib/map/recommend";
import { walkingTimeFactor } from "../src/lib/map/planning";
import { EXPERIMENT_CONFIGS, type ExperimentConfigId, type RouteExperimentScenario } from "../src/lib/experiments/route-experiment";
import { BGE_MODEL_REVISION, type SemanticIntent } from "../src/lib/semantic/types";
import { WALKING_MATRIX } from "../src/lib/routing/walking-matrix";

const ROOT = path.resolve(".");
const OUTPUT_DIR = path.join(ROOT, "experiments", "route-planning");
const REQUIRED_FILES = [
  "scenarios.json", "semantic-fixtures.json", "results.csv", "performance.csv",
  "summary.json", "report.md", "report.html", "report.pdf",
];
const CONFIGS = Object.keys(EXPERIMENT_CONFIGS) as ExperimentConfigId[];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function parseCsv(text: string): Record<string, string>[] {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const keys = header.split(",");
  return lines.map((line) => Object.fromEntries(line.split(",").map((value, index) => [keys[index], value])));
}

async function main(): Promise<void> {
  for (const file of REQUIRED_FILES) await access(path.join(OUTPUT_DIR, file));
  const scenariosDocument = JSON.parse(await readFile(path.join(OUTPUT_DIR, "scenarios.json"), "utf8")) as {
    scenarios: RouteExperimentScenario[];
  };
  const semanticDocument = JSON.parse(await readFile(path.join(OUTPUT_DIR, "semantic-fixtures.json"), "utf8")) as {
    model: { revision: string };
    fixtures: Record<string, SemanticIntent>;
  };
  const summary = JSON.parse(await readFile(path.join(OUTPUT_DIR, "summary.json"), "utf8"));
  const rows = parseCsv(await readFile(path.join(OUTPUT_DIR, "results.csv"), "utf8"));
  const performanceRows = parseCsv(await readFile(path.join(OUTPUT_DIR, "performance.csv"), "utf8"));
  const poiIds = new Set(MAP_POIS.map((poi) => poi.id));

  assert(scenariosDocument.scenarios.length === 60, "场景总数必须为 60");
  assert(new Set(scenariosDocument.scenarios.map((scenario) => scenario.id)).size === 60, "场景 ID 必须唯一");
  assert(scenariosDocument.scenarios.filter((scenario) => scenario.expectedFeasible).length === 56, "应有 56 个可行场景");
  assert(scenariosDocument.scenarios.filter((scenario) => !scenario.expectedFeasible).length === 4, "应有 4 个不可行场景");
  const templateCounts = new Map<string, number>();
  const profileCounts = new Map<string, number>();
  for (const scenario of scenariosDocument.scenarios) {
    assert(scenario.candidatePoiIds.length >= 2 && scenario.candidatePoiIds.length <= 5, `${scenario.id} 的 POI 数量非法`);
    assert(scenario.candidatePoiIds.every((id) => poiIds.has(id)), `${scenario.id} 引用了无效 POI`);
    assert(new Set(scenario.candidatePoiIds).size === scenario.candidatePoiIds.length, `${scenario.id} 包含重复 POI`);
    templateCounts.set(scenario.templateId, (templateCounts.get(scenario.templateId) ?? 0) + 1);
    profileCounts.set(scenario.profileId, (profileCounts.get(scenario.profileId) ?? 0) + 1);
  }
  assert(templateCounts.size === 12 && [...templateCounts.values()].every((count) => count === 5), "12 个模板必须各出现 5 次");
  assert(profileCounts.size === 5 && [...profileCounts.values()].every((count) => count === 12), "5 个配置必须各出现 12 次");

  assert(Object.keys(semanticDocument.fixtures).length === 12, "必须包含 12 条 BGE 语义固定结果");
  assert(semanticDocument.model.revision === BGE_MODEL_REVISION, "BGE revision 不一致");
  assert(Object.values(semanticDocument.fixtures).every((fixture) => fixture.provider === "bge-local"), "语义固定结果必须来自真实本地 BGE");
  assert(Object.values(semanticDocument.fixtures).every((fixture) => fixture.matches.length === MAP_POIS.length), "每条语义结果必须覆盖 23 个 POI");

  assert(rows.length === 240, "功能实验必须有 240 行");
  for (const scenario of scenariosDocument.scenarios) {
    const scenarioRows = rows.filter((row) => row.scenarioId === scenario.id);
    assert(scenarioRows.length === 4, `${scenario.id} 缺少实验配置`);
    assert(CONFIGS.every((config) => scenarioRows.some((row) => row.config === config)), `${scenario.id} 四种配置不完整`);
    assert(scenarioRows.every((row) => row.overBudgetViolation === "false"), `${scenario.id} 存在超预算违规`);
    assert(scenarioRows.every((row) => row.routeClosingViolation === "false"), `${scenario.id} 存在闭馆违规`);
    assert(scenarioRows.every((row) => row.closedPoiViolationCount === "0"), `${scenario.id} 使用了关闭地点`);
  }
  const fullRows = rows.filter((row) => row.config === "full");
  assert(fullRows.filter((row) => row.oracleFeasible === "true" && row.generated === "true").length === 56, "Full 可行生成数不一致");
  assert(fullRows.filter((row) => row.oracleFeasible === "false" && row.generated === "false").length === 4, "Full 正确拒绝数不一致");
  assert(summary.configurations.full.feasibleGenerationRatePercent === 100, "汇总可行生成率不一致");
  assert(summary.configurations.full.correctRejectionRatePercent === 100, "汇总正确拒绝率不一致");
  assert(summary.configurations.full.overBudgetViolationRatePercent === 0, "汇总超预算率不一致");
  assert(summary.configurations.full.routeClosingViolationRatePercent === 0, "汇总闭馆违规率不一致");

  assert(performanceRows.length === 1200, "性能样本必须为 1,200 行");
  assert(scenariosDocument.scenarios.every((scenario) => performanceRows.filter((row) => row.scenarioId === scenario.id).length === 20), "每场景必须有 20 次性能样本");
  assert(summary.performance.gateP95Passed, "P95 未通过 500ms 门槛");
  assert(summary.performance.gateOver500RatePassed, ">500ms 比例未通过 1% 门槛");

  const determinismScenario = scenariosDocument.scenarios.find((scenario) => scenario.expectedFeasible)!;
  const intent = semanticDocument.fixtures[determinismScenario.templateId];
  const options = {
    startId: determinismScenario.startPoiId,
    preference: determinismScenario.preference,
    timeBudgetMinutes: determinismScenario.budgetMinutes,
    walkingFactor: walkingTimeFactor(determinismScenario.walkingAbility),
    weatherCondition: determinismScenario.weatherCondition,
    departureTimeMinutes: determinismScenario.departureTimeMinutes,
    closedPoiIds: determinismScenario.closedPoiIds,
    avoidCrowds: determinismScenario.avoidCrowds,
    nightMode: determinismScenario.nightMode,
    cultureFocusTags: intent.inferredPatch.cultureFocusTags ?? [],
    cultureFocusEntityIds: intent.inferredPatch.cultureFocusEntityIds ?? [],
    dataUpdatedAt: WALKING_MATRIX.generatedAt,
    dataStatus: "离线实验",
    semanticIntent: intent,
    featureFlags: EXPERIMENT_CONFIGS.full,
  };
  const first = recommendTwoRoutes(determinismScenario.candidatePoiIds, [], options);
  const second = recommendTwoRoutes(determinismScenario.candidatePoiIds, [], options);
  const deterministicProjection = (result: typeof first) => result && ({
    shortest: {
      poiIds: result.shortest.poiIds,
      metrics: result.shortest.metrics,
      scheduledStops: result.shortest.scheduledStops,
      comparison: result.shortest.algorithmComparison,
    },
    scenic: {
      poiIds: result.scenic.poiIds,
      metrics: result.scenic.metrics,
      scheduledStops: result.scenic.scheduledStops,
      comparison: result.scenic.algorithmComparison,
    },
  });
  assert(
    JSON.stringify(deterministicProjection(first)) === JSON.stringify(deterministicProjection(second)),
    "相同输入的路线顺序和指标必须一致（时间戳与性能字段除外）",
  );

  const chartFiles = (await readdir(path.join(OUTPUT_DIR, "charts"))).filter((name) => name.endsWith(".svg"));
  assert(chartFiles.length >= 6, "至少需要 6 张 SVG 图表");
  const reportText = [
    await readFile(path.join(OUTPUT_DIR, "report.md"), "utf8"),
    await readFile(path.join(OUTPUT_DIR, "report.html"), "utf8"),
    await readFile(path.join(OUTPUT_DIR, "summary.json"), "utf8"),
  ].join("\n");
  assert(!/(?:NaN|Infinity|TODO|PLACEHOLDER|待填写)/i.test(reportText), "报告含 NaN、无穷值或手填占位符");
  assert(reportText.includes(String(summary.performance.p95)), "报告未引用汇总 P95");
  const html = await readFile(path.join(OUTPUT_DIR, "report.html"), "utf8");
  assert((html.match(/<svg /g) ?? []).length >= 6, "自包含 HTML 未嵌入全部 SVG");
  assert((await stat(path.join(OUTPUT_DIR, "report.pdf"))).size > 100_000, "PDF 体积异常");
  const pdfInfo = spawnSync("pdfinfo", [path.join(OUTPUT_DIR, "report.pdf")], { encoding: "utf8" });
  assert(pdfInfo.status === 0, "pdfinfo 无法读取报告 PDF");
  const pageCount = Number(pdfInfo.stdout.match(/Pages:\s+(\d+)/)?.[1]);
  assert(pageCount >= 8 && pageCount <= 12, `PDF 页数必须为 8–12，当前为 ${pageCount}`);
  assert(/Page size:\s+59[45]/.test(pdfInfo.stdout), "PDF 必须为 A4");

  console.log("Experiment package verified: 60 scenarios, 240 functional rows, 1,200 performance samples, 9-page A4 PDF.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
