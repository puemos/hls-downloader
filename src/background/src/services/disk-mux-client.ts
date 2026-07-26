import type { OutputContainer } from "@hls-downloader/core/lib/entities";
import type {
  DiskMuxRequest,
  DiskMuxResponse,
  DiskMuxSuccess,
} from "./disk-mux-protocol";
import diskMuxWorkerPath from "../workers/disk-mux-worker?worker&url";
import { deleteExportFile } from "./opfs-storage";

export type DiskMuxOptions = {
  storageKey: string;
  videoLength: number;
  audioLength: number;
  container: OutputContainer;
  subtitleText?: string;
  subtitleLanguage?: string;
};

type ProgressListener = (progress: number, message: string) => void;

type InFlightMux = {
  promise: Promise<DiskMuxSuccess>;
  listeners: Set<ProgressListener>;
  storageKey: string;
  controller: AbortController;
  hasStarted: () => boolean;
};

const inFlight = new Map<string, InFlightMux>();
let muxQueue: Promise<void> = Promise.resolve();

function randomId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.floor(Math.random() * 1e9)}`
  );
}

function getRuntimeURL(path: string): string {
  const runtime =
    (globalThis as any).chrome?.runtime ?? (globalThis as any).browser?.runtime;
  if (runtime?.getURL) {
    return runtime.getURL(path);
  }
  return new URL(`/${path}`, globalThis.location?.href ?? "http://localhost")
    .href;
}

function getWorkerURL(): string {
  if (
    /^(blob:|data:|https?:|moz-extension:|chrome-extension:)/.test(
      diskMuxWorkerPath,
    )
  ) {
    return diskMuxWorkerPath;
  }
  return getRuntimeURL(diskMuxWorkerPath.replace(/^\/+/, ""));
}

function hashText(value: string | undefined): string {
  if (!value) return "none";
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function muxKey(options: DiskMuxOptions): string {
  return [
    options.storageKey,
    options.container,
    hashText(options.subtitleText),
    options.subtitleLanguage ?? "",
  ].join(":");
}

async function runWorker(
  options: DiskMuxOptions,
  listeners: Set<ProgressListener>,
  signal: AbortSignal,
): Promise<DiskMuxSuccess> {
  if (signal.aborted) {
    throw new DOMException("Finalization was cancelled", "AbortError");
  }
  if (typeof Worker === "undefined") {
    throw new Error("Dedicated workers are unavailable in this browser");
  }

  const requestId = randomId();
  const outputContainer =
    options.subtitleText !== undefined ? "mkv" : options.container;
  const exportId = `${randomId()}.${outputContainer}`;
  const worker = new Worker(getWorkerURL(), {
    type: "module",
    name: "hls-downloader-disk-mux",
  });
  const abort = () => {
    worker.terminate();
  };
  let rejectCancelled: () => void = () => undefined;
  let completed = false;
  signal.addEventListener("abort", abort, { once: true });

  try {
    const result = await new Promise<DiskMuxSuccess>((resolve, reject) => {
      rejectCancelled = () =>
        reject(new DOMException("Finalization was cancelled", "AbortError"));
      signal.addEventListener("abort", rejectCancelled, { once: true });
      worker.onerror = (event) => {
        reject(new Error(event.message || "The mux worker crashed"));
      };
      worker.onmessage = ({ data }: MessageEvent<DiskMuxResponse>) => {
        if (!data || data.requestId !== requestId) {
          return;
        }
        if (data.type === "progress") {
          for (const listener of listeners) {
            try {
              listener(data.progress, data.message);
            } catch (error) {
              console.warn("[mux] progress listener failed", error);
            }
          }
          return;
        }
        if (data.type === "failure") {
          reject(new Error(data.message));
          return;
        }
        resolve(data);
      };

      const request: DiskMuxRequest = {
        type: "mux",
        requestId,
        coreURL: getRuntimeURL("assets/ffmpeg/ffmpeg-core.js"),
        wasmURL: getRuntimeURL("assets/ffmpeg/ffmpeg-core.wasm"),
        exportId,
        ...options,
      };
      worker.postMessage(request);
    }).finally(() => {
      signal.removeEventListener("abort", rejectCancelled);
    });
    completed = true;
    return result;
  } finally {
    signal.removeEventListener("abort", abort);
    worker.terminate();
    if (!completed) {
      await deleteExportFile(exportId).catch(() => undefined);
    }
  }
}

export function muxDiskBackedMedia(
  options: DiskMuxOptions,
  onProgress?: ProgressListener,
): Promise<DiskMuxSuccess> {
  const key = muxKey(options);
  const existing = inFlight.get(key);
  if (existing) {
    if (onProgress) {
      existing.listeners.add(onProgress);
    }
    return existing.promise;
  }

  const listeners = new Set<ProgressListener>();
  if (onProgress) {
    listeners.add(onProgress);
  }

  const controller = new AbortController();
  let started = false;
  const promise = muxQueue.then(() => {
    if (controller.signal.aborted) {
      throw new DOMException("Finalization was cancelled", "AbortError");
    }
    started = true;
    return runWorker(options, listeners, controller.signal);
  });
  muxQueue = promise.then(
    () => undefined,
    () => undefined,
  );
  const active = {
    promise,
    listeners,
    storageKey: options.storageKey,
    controller,
    hasStarted: () => started,
  };
  inFlight.set(key, active);
  const cleanup = () => {
    if (inFlight.get(key) === active) {
      inFlight.delete(key);
    }
  };
  void promise.then(cleanup, cleanup);
  return promise;
}

export async function cancelDiskBackedMux(storageKey: string): Promise<void> {
  const active = [...inFlight.values()].filter(
    (entry) => entry.storageKey === storageKey,
  );
  for (const entry of active) {
    entry.controller.abort();
  }
  await Promise.allSettled(
    active.filter((entry) => entry.hasStarted()).map((entry) => entry.promise),
  );
}
