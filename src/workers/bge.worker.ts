/// <reference lib="webworker" />

import { env, pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import {
  BGE_MODEL_ID,
  BGE_QUERY_INSTRUCTION,
  type BgeWorkerRequest,
  type BgeWorkerResponse,
} from "@/lib/semantic/types";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function post(message: BgeWorkerResponse) {
  scope.postMessage(message);
}

function getExtractor() {
  if (extractorPromise) return extractorPromise;
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = "/models/";
  env.useBrowserCache = true;
  const wasm = env.backends.onnx.wasm;
  if (wasm) {
    wasm.numThreads = 1;
    wasm.wasmPaths = {
      mjs: "/wasm/ort-wasm-simd-threaded.mjs",
      wasm: "/wasm/ort-wasm-simd-threaded.wasm",
    };
  }
  extractorPromise = pipeline("feature-extraction", BGE_MODEL_ID, {
    dtype: "q8",
    device: "wasm",
    progress_callback: (progress) => {
      const percentage = "progress" in progress && typeof progress.progress === "number"
        ? Math.round(progress.progress)
        : 0;
      const file = "file" in progress && typeof progress.file === "string" ? progress.file : "本地模型";
      post({ type: "progress", progress: percentage, message: `正在载入 ${file}` });
    },
  });
  return extractorPromise;
}

scope.onmessage = async (event: MessageEvent<BgeWorkerRequest>) => {
  const request = event.data;
  try {
    const extractor = await getExtractor();
    if (request.type === "init") {
      post({ type: "ready" });
      return;
    }

    const startedAt = performance.now();
    const output = await extractor(`${BGE_QUERY_INSTRUCTION}${request.text}`, {
      pooling: "cls",
      normalize: true,
    });
    post({
      type: "embedding",
      requestId: request.requestId,
      vector: Array.from(output.data as Float32Array),
      inferenceMs: Math.max(1, Math.round(performance.now() - startedAt)),
    });
  } catch (error) {
    extractorPromise = null;
    post({
      type: "error",
      requestId: request.type === "embed" ? request.requestId : undefined,
      message: error instanceof Error ? error.message : "本地语义模型初始化失败",
    });
  }
};
