import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAP_POIS } from "../src/lib/map/pois";

const endpoint = process.env.VALHALLA_MATRIX_URL
  ?? "https://valhalla1.openstreetmap.de/sources_to_targets";
const statusEndpoint = process.env.VALHALLA_STATUS_URL
  ?? new URL("status", endpoint).toString();
const generatedAt = new Date().toISOString();
const locations = MAP_POIS.map((poi) => ({ id: poi.id, lat: poi.lat, lon: poi.lng }));
const sourceHash = createHash("sha256").update(JSON.stringify(locations)).digest("hex");

interface MatrixResponse {
  sources_to_targets: {
    durations: Array<Array<number | null>>;
    distances: Array<Array<number | null>>;
  };
  units: string;
  algorithm: string;
}

async function main() {
  // The public reference service caps source×target pairs at 100. Keep every
  // request below that limit and concatenate the row-ordered responses.
  const batchSize = Math.max(1, Math.floor(100 / locations.length));
  const durations: Array<Array<number | null>> = [];
  const distances: Array<Array<number | null>> = [];
  let algorithm = "";
  let units = "kilometers";
  for (let offset = 0; offset < locations.length; offset += batchSize) {
    const sourceBatch = locations.slice(offset, offset + batchSize);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sources: sourceBatch.map(({ lat, lon }) => ({ lat, lon })),
        targets: locations.map(({ lat, lon }) => ({ lat, lon })),
        costing: "pedestrian",
        units: "kilometers",
        verbose: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      throw new Error(`Valhalla matrix request failed: HTTP ${response.status} ${await response.text()}`);
    }
    const payload = await response.json() as MatrixResponse;
    durations.push(...payload.sources_to_targets.durations);
    distances.push(...payload.sources_to_targets.distances);
    algorithm ||= payload.algorithm;
    units = payload.units;
  }
  if (durations.length !== locations.length || distances.length !== locations.length) {
    throw new Error(`Expected ${locations.length} matrix rows`);
  }
  const unreachablePairs: string[] = [];
  for (let from = 0; from < locations.length; from++) {
    if (durations[from]?.length !== locations.length || distances[from]?.length !== locations.length) {
      throw new Error(`Matrix row ${from} has an unexpected length`);
    }
    for (let to = 0; to < locations.length; to++) {
      if (durations[from][to] == null || distances[from][to] == null) {
        unreachablePairs.push(`${locations[from].id}>${locations[to].id}`);
      }
    }
  }
  if (unreachablePairs.length) throw new Error(`Unreachable POI pairs: ${unreachablePairs.join(", ")}`);

  let status: Record<string, unknown> = {};
  try {
    const statusResponse = await fetch(statusEndpoint, { signal: AbortSignal.timeout(10_000) });
    if (statusResponse.ok) status = await statusResponse.json() as Record<string, unknown>;
  } catch {
    // Matrix provenance remains valid even if the optional status request is unavailable.
  }

  const document = {
    schemaVersion: 1,
    generatedAt,
    sourceHash,
    provider: "Valhalla",
    providerVersion: status.version ?? null,
    algorithm,
    costing: "pedestrian",
    units,
    sourceDataset: "OpenStreetMap walking network",
    attribution: "© OpenStreetMap contributors",
    buildEndpoint: new URL(endpoint).origin,
    tilesetLastModified: status.tileset_last_modified ?? null,
    locationIds: locations.map((location) => location.id),
    locations,
    durationsSeconds: durations,
    distancesKm: distances,
    unreachablePairs,
  };
  const target = path.resolve(process.cwd(), "src/data/nanjing-walking-matrix.json");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  console.log(`Wrote ${locations.length}×${locations.length} walking matrix to ${target}`);
  console.log(`Provider ${document.providerVersion ?? "unknown"}; source hash ${sourceHash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
