import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { env, pipeline } from "@huggingface/transformers";
import { MAP_POIS } from "../src/lib/map/pois";
import { inferSemanticConstraints, rankPoisByEmbedding } from "../src/lib/semantic/rules";
import {
  BGE_MODEL_ID,
  BGE_MODEL_REVISION,
  BGE_MODEL_SOURCE,
  BGE_QUERY_INSTRUCTION,
  type SemanticIntent,
} from "../src/lib/semantic/types";
import type { RouteExperimentScenario } from "../src/lib/experiments/route-experiment";

const ROOT = path.resolve(".");
const OUTPUT_DIR = path.join(ROOT, "experiments", "route-planning");
const SCENARIOS_PATH = path.join(OUTPUT_DIR, "scenarios.json");
const EMBEDDINGS_PATH = path.join(ROOT, "src", "data", "poi-embeddings.json");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "semantic-fixtures.json");

interface TensorLike {
  data: Float32Array | number[];
  dims: number[];
}

async function main(): Promise<void> {
  const scenariosDocument = JSON.parse(await readFile(SCENARIOS_PATH, "utf8")) as {
    scenarios: RouteExperimentScenario[];
  };
  const embeddings = JSON.parse(await readFile(EMBEDDINGS_PATH, "utf8")) as {
    vectors: Record<string, number[]>;
    sourceHash: string;
    dimensions: number;
  };
  const queries = [...new Map(
    scenariosDocument.scenarios.map((scenario) => [scenario.templateId, scenario.query]),
  ).entries()].map(([templateId, query]) => ({ templateId, query }));

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = `${path.join(ROOT, "public", "models")}${path.sep}`;

  const loadStarted = performance.now();
  const extractor = await pipeline("feature-extraction", BGE_MODEL_ID, { dtype: "q8" });
  const coldLoadMs = performance.now() - loadStarted;
  await extractor(`${BGE_QUERY_INSTRUCTION}南京文化慢游`, { pooling: "cls", normalize: true });

  const generatedAt = new Date().toISOString();
  const fixtures: Record<string, SemanticIntent> = {};
  for (const item of queries) {
    const started = performance.now();
    const output = await extractor(`${BGE_QUERY_INSTRUCTION}${item.query}`, {
      pooling: "cls",
      normalize: true,
    }) as TensorLike;
    const inferenceMs = performance.now() - started;
    const vector = Array.from(output.data).slice(0, embeddings.dimensions);
    fixtures[item.templateId] = {
      query: item.query,
      provider: "bge-local",
      modelId: BGE_MODEL_ID,
      modelRevision: BGE_MODEL_REVISION,
      inferredPatch: inferSemanticConstraints(item.query),
      matches: rankPoisByEmbedding(item.query, vector, embeddings.vectors, MAP_POIS),
      inferenceMs: Number(inferenceMs.toFixed(3)),
      createdAt: generatedAt,
    };
  }

  await extractor.dispose();
  await writeFile(OUTPUT_PATH, `${JSON.stringify({
    schemaVersion: 1,
    generatedAt,
    model: {
      id: BGE_MODEL_ID,
      source: BGE_MODEL_SOURCE,
      revision: BGE_MODEL_REVISION,
      dtype: "q8",
      pooling: "cls",
      normalized: true,
      queryInstruction: BGE_QUERY_INSTRUCTION,
      dimensions: embeddings.dimensions,
      poiEmbeddingSourceHash: embeddings.sourceHash,
    },
    coldLoadMs: Number(coldLoadMs.toFixed(3)),
    warmInferenceMs: Object.values(fixtures).map((fixture) => fixture.inferenceMs),
    fixtures,
  }, null, 2)}\n`, "utf8");
  console.log(`Wrote ${queries.length} real BGE semantic fixtures to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
