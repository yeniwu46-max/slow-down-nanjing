import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env, pipeline } from "@huggingface/transformers";
import { MAP_POIS } from "../src/lib/map/pois";
import { buildPoiSemanticDocument } from "../src/lib/semantic/rules";
import {
  BGE_MODEL_ID,
  BGE_MODEL_REVISION,
} from "../src/lib/semantic/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "src", "data", "poi-embeddings.json");
const documents = MAP_POIS.map((poi) => ({
  poiId: poi.id,
  text: buildPoiSemanticDocument(poi),
}));
const sourceHash = createHash("sha256")
  .update(JSON.stringify(documents))
  .digest("hex");

async function main() {
  if (process.argv.includes("--check")) {
    const existing = JSON.parse(await readFile(outputPath, "utf8"));
  const valid = existing.sourceHash === sourceHash
    && existing.modelRevision === BGE_MODEL_REVISION
    && Object.keys(existing.vectors ?? {}).length === MAP_POIS.length;
    if (!valid) {
      console.error("POI embeddings are stale. Run: npm run build:embeddings");
      process.exitCode = 1;
      return;
    }
    console.log(`POI embeddings are current (${MAP_POIS.length} POIs, ${existing.dimensions} dimensions).`);
    return;
  }

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = `${path.join(root, "public", "models")}${path.sep}`;

  console.log(`Loading ${BGE_MODEL_ID} from ${env.localModelPath}`);
  const extractor = await pipeline("feature-extraction", BGE_MODEL_ID, {
    dtype: "q8",
  });
  const output = await extractor(documents.map((item) => item.text), {
    pooling: "cls",
    normalize: true,
  });
  const dimensions = output.dims.at(-1) ?? 0;
  if (dimensions !== 512 || output.dims[0] !== documents.length) {
    throw new Error(`Unexpected embedding shape: ${output.dims.join("x")}`);
  }
  const values = Array.from(output.data as Float32Array);
  const vectors = Object.fromEntries(documents.map((item, row) => [
    item.poiId,
    values.slice(row * dimensions, (row + 1) * dimensions).map((value) => Number(value.toFixed(7))),
  ]));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    modelId: BGE_MODEL_ID,
    modelRevision: BGE_MODEL_REVISION,
    dimensions,
    sourceHash,
    generatedAt: new Date().toISOString(),
    vectors,
  }, null, 2)}\n`, "utf8");
  await extractor.dispose();
  console.log(`Wrote ${documents.length} POI vectors to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
