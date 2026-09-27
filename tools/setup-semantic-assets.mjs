import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, copyFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "tools", "semantic-model-assets.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const modelDir = path.join(root, "public", "models", manifest.modelId);
const wasmDir = path.join(root, "public", "wasm");

async function hashFile(filePath) {
  const hash = createHash("sha256");
  const handle = await import("node:fs");
  await new Promise((resolve, reject) => {
    const input = handle.createReadStream(filePath);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("error", reject);
    input.on("end", resolve);
  });
  return hash.digest("hex");
}

async function download(relativePath) {
  const destination = path.join(modelDir, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  const expected = manifest.sha256[relativePath];
  try {
    const existing = await stat(destination);
    if (existing.size > 0 && (!expected || await hashFile(destination) === expected)) {
      console.log(`cached  ${relativePath}`);
      return;
    }
  } catch {}

  const url = `https://huggingface.co/${manifest.modelSource}/resolve/${manifest.revision}/${relativePath}`;
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error(`Download failed ${response.status}: ${relativePath}`);
  const temporary = `${destination}.download`;
  await rm(temporary, { force: true });
  const output = createWriteStream(temporary);
  await finished(Readable.fromWeb(response.body).pipe(output));
  if (expected && await hashFile(temporary) !== expected) {
    await rm(temporary, { force: true });
    throw new Error(`SHA-256 mismatch: ${relativePath}`);
  }
  await rename(temporary, destination);
  console.log(`fetched ${relativePath}`);
}

await Promise.all(manifest.files.map(download));
await mkdir(wasmDir, { recursive: true });
for (const file of ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]) {
  const source = path.join(root, "node_modules", "onnxruntime-web", "dist", file);
  const destination = path.join(wasmDir, file);
  await copyFile(source, destination);
  console.log(`copied  wasm/${file}`);
}

console.log("\nSHA-256 values:");
for (const relativePath of manifest.files) {
  console.log(`${relativePath}\t${await hashFile(path.join(modelDir, relativePath))}`);
}
