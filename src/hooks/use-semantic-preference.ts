"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import poiEmbeddings from "@/data/poi-embeddings.json";
import { MAP_POIS } from "@/lib/map/pois";
import {
  clampPreferenceText,
  inferSemanticConstraints,
  rankPoisByEmbedding,
  rankPoisByKeyword,
} from "@/lib/semantic/rules";
import {
  BGE_MODEL_ID,
  BGE_MODEL_REVISION,
  type BgeWorkerResponse,
  type ModelLoadState,
  type SemanticIntent,
} from "@/lib/semantic/types";

const FALLBACK_STATE: ModelLoadState = {
  status: "idle",
  progress: 0,
  message: "模型将在首次分析时从本地载入",
};

type PendingRequest = {
  resolve: (value: { vector: number[]; inferenceMs: number }) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const vectors = poiEmbeddings.vectors as Record<string, number[]>;

export function useSemanticPreference() {
  const workerRef = useRef<Worker | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const pendingRef = useRef(new Map<string, PendingRequest>());
  const [modelState, setModelState] = useState<ModelLoadState>(FALLBACK_STATE);
  const [analyzing, setAnalyzing] = useState(false);

  const createWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("../workers/bge.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<BgeWorkerResponse>) => {
      const message = event.data;
      if (message.type === "progress") {
        setModelState({ status: "loading", progress: message.progress, message: message.message });
        return;
      }
      if (message.type === "ready") {
        setModelState({ status: "ready", progress: 100, message: "BGE 中文模型已在本机就绪" });
        return;
      }
      if (message.type === "embedding") {
        const pending = pendingRef.current.get(message.requestId);
        if (!pending) return;
        clearTimeout(pending.timer);
        pendingRef.current.delete(message.requestId);
        pending.resolve({ vector: message.vector, inferenceMs: message.inferenceMs });
        return;
      }
      const pending = message.requestId ? pendingRef.current.get(message.requestId) : undefined;
      if (pending) {
        clearTimeout(pending.timer);
        pendingRef.current.delete(message.requestId!);
        pending.reject(new Error(message.message));
      }
      setModelState({ status: "fallback", progress: 0, message: "模型不可用，已切换本地规则兜底" });
    };
    worker.onerror = () => {
      setModelState({ status: "fallback", progress: 0, message: "Worker 不可用，已切换本地规则兜底" });
    };
    workerRef.current = worker;
    return worker;
  }, []);

  const ensureReady = useCallback(() => {
    if (readyPromiseRef.current) return readyPromiseRef.current;
    setModelState({ status: "loading", progress: 0, message: "正在初始化本地 BGE 模型" });
    const worker = createWorker();
    readyPromiseRef.current = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("本地模型初始化超时")), 20_000);
      const listener = (event: MessageEvent<BgeWorkerResponse>) => {
        if (event.data.type === "ready") {
          clearTimeout(timeout);
          worker.removeEventListener("message", listener);
          resolve();
        } else if (event.data.type === "error" && !event.data.requestId) {
          clearTimeout(timeout);
          worker.removeEventListener("message", listener);
          reject(new Error(event.data.message));
        }
      };
      worker.addEventListener("message", listener);
      worker.postMessage({ type: "init" });
    }).catch((error) => {
      readyPromiseRef.current = null;
      throw error;
    });
    return readyPromiseRef.current;
  }, [createWorker]);

  const analyze = useCallback(async (rawQuery: string): Promise<SemanticIntent> => {
    const query = clampPreferenceText(rawQuery);
    if (!query) throw new Error("请先输入与路线有关的偏好");
    setAnalyzing(true);
    const startedAt = performance.now();
    const inferredPatch = inferSemanticConstraints(query);
    try {
      await ensureReady();
      const requestId = crypto.randomUUID();
      const worker = createWorker();
      const embedding = await new Promise<{ vector: number[]; inferenceMs: number }>((resolve, reject) => {
        const timer = setTimeout(() => {
          pendingRef.current.delete(requestId);
          reject(new Error("本地语义分析超时"));
        }, 10_000);
        pendingRef.current.set(requestId, { resolve, reject, timer });
        worker.postMessage({ type: "embed", requestId, text: query });
      });
      return {
        query,
        provider: "bge-local",
        modelId: BGE_MODEL_ID,
        modelRevision: BGE_MODEL_REVISION,
        inferredPatch,
        matches: rankPoisByEmbedding(query, embedding.vector, vectors, MAP_POIS),
        inferenceMs: embedding.inferenceMs,
        createdAt: new Date().toISOString(),
      };
    } catch {
      setModelState({ status: "fallback", progress: 0, message: "模型不可用，已切换本地规则兜底" });
      return {
        query,
        provider: "keyword-fallback",
        modelId: "local-keyword-rules",
        modelRevision: "2026-09",
        inferredPatch,
        matches: rankPoisByKeyword(query, MAP_POIS),
        inferenceMs: Math.max(1, Math.round(performance.now() - startedAt)),
        createdAt: new Date().toISOString(),
      };
    } finally {
      setAnalyzing(false);
    }
  }, [createWorker, ensureReady]);

  useEffect(() => () => {
    workerRef.current?.terminate();
    pendingRef.current.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new Error("语义分析已取消"));
    });
    pendingRef.current.clear();
  }, []);

  return { analyze, analyzing, modelState };
}
