import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const json = process.argv.includes("--json");

async function fileCheck(relativePath, expectedSha256) {
  const absolutePath = path.join(root, relativePath);
  try {
    const details = await stat(absolutePath);
    const result = { name: relativePath, status: "ok", bytes: details.size };
    if (expectedSha256) {
      const buffer = await readFile(absolutePath);
      const actual = createHash("sha256").update(buffer).digest("hex");
      if (actual !== expectedSha256) {
        return { name: relativePath, status: "error", detail: "SHA-256 mismatch" };
      }
    }
    return result;
  } catch {
    return { name: relativePath, status: "missing" };
  }
}

async function endpointCheck(name, url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1800) });
    if (!response.ok) {
      return { name, status: "unavailable", detail: `HTTP ${response.status}`, url };
    }
    return { name, status: "ok", url };
  } catch (error) {
    return {
      name,
      status: "unavailable",
      detail: error instanceof Error ? error.message : String(error),
      url,
    };
  }
}

const manifest = JSON.parse(
  await readFile(path.join(root, "tools/semantic-model-assets.json"), "utf8"),
);
const modelChecks = await Promise.all(
  manifest.files.map((assetPath) =>
    fileCheck(
      `public/models/${manifest.modelId}/${assetPath}`,
      manifest.sha256[assetPath],
    ),
  ),
);
const localChecks = await Promise.all([
  fileCheck("public/wasm/ort-wasm-simd-threaded.mjs"),
  fileCheck("public/wasm/ort-wasm-simd-threaded.wasm"),
  fileCheck("src/data/poi-embeddings.json"),
  fileCheck("src/data/nanjing-walking-matrix.json"),
  fileCheck("integrations/data/shared/nanjing.osm.pbf"),
]);
const serviceChecks = await Promise.all([
  endpointCheck("OR-Tools", process.env.OPTIMIZER_URL ?? "http://localhost:8010/health"),
  endpointCheck("Valhalla", process.env.VALHALLA_URL ?? "http://localhost:8002/status"),
  endpointCheck("GraphHopper", process.env.GRAPHHOPPER_URL ?? "http://localhost:8989/info"),
  endpointCheck("GraphHopper Maps", process.env.GRAPHHOPPER_MAPS_URL ?? "http://localhost:3007/"),
]);

const report = {
  generatedAt: new Date().toISOString(),
  model: modelChecks,
  local: localChecks,
  optionalServices: serviceChecks,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const item of [...modelChecks, ...localChecks, ...serviceChecks]) {
    const suffix = item.detail ? ` — ${item.detail}` : "";
    console.log(`${item.status === "ok" ? "OK" : "--"} ${item.name}${suffix}`);
  }
  console.log("Optional services may be unavailable without blocking the Next.js competition site.");
}

const requiredFailure = [...modelChecks, ...localChecks.slice(0, 4)].some(
  (item) => item.status !== "ok",
);
const strictFailure = [...localChecks, ...serviceChecks].some((item) => item.status !== "ok");
if (requiredFailure || (strict && strictFailure)) process.exitCode = 1;
