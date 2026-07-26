import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  DiskMuxRequest,
  DiskMuxResponse,
} from "../src/services/disk-mux-protocol";
import {
  cancelDiskBackedMux,
  muxDiskBackedMedia,
  type DiskMuxOptions,
} from "../src/services/disk-mux-client";

class ControlledWorker {
  static instances: ControlledWorker[] = [];

  onerror: ((event: { message?: string }) => void) | null = null;
  onmessage: ((event: MessageEvent<DiskMuxResponse>) => void) | null = null;
  request?: DiskMuxRequest;
  terminated = false;

  constructor(
    readonly url: string,
    readonly options: WorkerOptions,
  ) {
    ControlledWorker.instances.push(this);
  }

  postMessage(request: DiskMuxRequest): void {
    this.request = request;
  }

  respond(response: DiskMuxResponse): void {
    this.onmessage?.({ data: response } as MessageEvent<DiskMuxResponse>);
  }

  terminate(): void {
    this.terminated = true;
  }
}

const baseOptions: DiskMuxOptions = {
  storageKey: "storage",
  videoLength: 2,
  audioLength: 1,
  container: "mp4",
};

async function nextWorker(index: number): Promise<ControlledWorker> {
  await vi.waitFor(() =>
    expect(ControlledWorker.instances.length).toBeGreaterThan(index),
  );
  const worker = ControlledWorker.instances[index];
  await vi.waitFor(() => expect(worker.request).toBeDefined());
  return worker;
}

function succeed(worker: ControlledWorker, size = 123): void {
  worker.respond({
    type: "success",
    requestId: worker.request!.requestId,
    exportId: worker.request!.exportId,
    mime: worker.request!.exportId.endsWith(".mkv")
      ? "video/x-matroska"
      : "video/mp4",
    size,
    wasmMemoryBytes: 64 * 1024 * 1024,
  });
}

describe("disk mux client", () => {
  beforeEach(() => {
    ControlledWorker.instances = [];
    vi.stubGlobal("Worker", ControlledWorker);
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (path: string) => `chrome-extension://test/${path}`,
      },
    });
  });

  it("coalesces identical finalizations and fans out progress", async () => {
    const firstProgress = vi.fn();
    const secondProgress = vi.fn();
    const first = muxDiskBackedMedia(baseOptions, firstProgress);
    const second = muxDiskBackedMedia(baseOptions, secondProgress);

    expect(second).toBe(first);
    const worker = await nextWorker(0);
    expect(worker.url).toMatch(/^chrome-extension:\/\/test\/.*disk-mux-worker/);
    expect(worker.options).toMatchObject({
      type: "module",
      name: "hls-downloader-disk-mux",
    });
    expect(worker.request).toMatchObject({
      storageKey: "storage",
      videoLength: 2,
      audioLength: 1,
      coreURL: "chrome-extension://test/assets/ffmpeg/ffmpeg-core.js",
      wasmURL: "chrome-extension://test/assets/ffmpeg/ffmpeg-core.wasm",
    });

    worker.respond({
      type: "progress",
      requestId: worker.request!.requestId,
      progress: 0.5,
      message: "Muxing",
    });
    expect(firstProgress).toHaveBeenCalledWith(0.5, "Muxing");
    expect(secondProgress).toHaveBeenCalledWith(0.5, "Muxing");

    succeed(worker);
    await expect(first).resolves.toMatchObject({
      size: 123,
      wasmMemoryBytes: 64 * 1024 * 1024,
    });
    expect(worker.terminated).toBe(true);
  });

  it("runs different jobs through one FIFO worker slot", async () => {
    const first = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "first",
    });
    const second = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "second",
    });

    const firstWorker = await nextWorker(0);
    expect(ControlledWorker.instances).toHaveLength(1);
    succeed(firstWorker);
    await first;

    const secondWorker = await nextWorker(1);
    expect(secondWorker.request?.storageKey).toBe("second");
    succeed(secondWorker);
    await second;
  });

  it("uses MKV for subtitles and continues the queue after a failure", async () => {
    const failed = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "failed",
    });
    const next = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "subtitled",
      subtitleText: "WEBVTT",
      subtitleLanguage: "en",
    });

    const failedWorker = await nextWorker(0);
    failedWorker.respond({
      type: "failure",
      requestId: failedWorker.request!.requestId,
      message: "No space left",
    });
    await expect(failed).rejects.toThrow("No space left");

    const nextMuxWorker = await nextWorker(1);
    expect(nextMuxWorker.request?.exportId).toMatch(/\.mkv$/);
    expect(nextMuxWorker.request?.subtitleLanguage).toBe("en");
    succeed(nextMuxWorker);
    await expect(next).resolves.toMatchObject({
      mime: "video/x-matroska",
    });
  });

  it("cancels active work and skips a cancelled queued job", async () => {
    const active = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "active",
    });
    const activeRejection = expect(active).rejects.toMatchObject({
      name: "AbortError",
    });
    const activeWorker = await nextWorker(0);

    await cancelDiskBackedMux("active");
    await activeRejection;
    expect(activeWorker.terminated).toBe(true);

    const blocker = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "blocker",
    });
    const queued = muxDiskBackedMedia({
      ...baseOptions,
      storageKey: "queued",
    });
    const queuedRejection = expect(queued).rejects.toMatchObject({
      name: "AbortError",
    });
    const blockerWorker = await nextWorker(1);

    await cancelDiskBackedMux("queued");
    expect(ControlledWorker.instances).toHaveLength(2);
    succeed(blockerWorker);
    await blocker;
    await queuedRejection;
    expect(ControlledWorker.instances).toHaveLength(2);
  });
});
