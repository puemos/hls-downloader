import { describe, it, expect, vi } from "vitest";
import { of, firstValueFrom, Subject } from "rxjs";
import { toArray } from "rxjs/operators";
import {
  fetchStorageStatsEpic,
  autoRefreshStorageStatsEpic,
  cleanupStorageEpic,
} from "../src/controllers/storage-epics.ts";
import { storageSlice, jobsSlice } from "../src/store/slices/index.ts";
import {
  createMockFS,
  createMockDependencies,
  createMockState,
  createTestJob,
  createTestJobStatus,
} from "./test-utils.ts";

describe("fetchStorageStatsEpic", () => {
  it("calls getStorageStats and emits refreshSuccess", async () => {
    const snapshot = {
      buckets: [
        {
          id: "b1",
          videoLength: 3,
          audioLength: 2,
          storedBytes: 5000,
          storedChunks: 3,
          updatedAt: 1000,
        },
      ],
      subtitlesBytes: 100,
      estimate: {
        usage: 5100,
        quota: 1_000_000_000,
        available: 999_994_900,
        source: "navigator" as const,
      },
    };
    const fs = createMockFS({ storageSnapshot: snapshot });
    const deps = createMockDependencies({ fs });
    const action$ = of(storageSlice.actions.refresh());

    const result = await firstValueFrom(
      fetchStorageStatsEpic(action$, {} as any, deps)
    );

    expect(fs.getStorageStats).toHaveBeenCalled();
    expect(result.type).toBe("storage/refreshSuccess");
    const payload = (result as any).payload;
    expect(payload.totalUsedBytes).toBe(5100);
    expect(payload.availableBytes).toBe(999_994_900);
    expect(payload.quotaBytes).toBe(1_000_000_000);
    expect(payload.estimateSource).toBe("navigator");
    expect(payload.nearQuota).toBe(false);
    expect(payload.subtitlesBytes).toBe(100);
    expect(payload.buckets).toHaveLength(1);
    expect(payload.buckets[0].id).toBe("b1");
    expect(payload.buckets[0].storedBytes).toBe(5000);
    expect(payload.buckets[0].totalFragments).toBe(5);
  });

  it("emits refreshFailure when getStorageStats rejects", async () => {
    const fs = createMockFS();
    (fs.getStorageStats as any).mockRejectedValue(new Error("IDB unavailable"));
    const deps = createMockDependencies({ fs });
    const action$ = of(storageSlice.actions.refresh());

    const result = await firstValueFrom(
      fetchStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result.type).toBe("storage/refreshFailure");
    expect((result as any).payload.error).toBe("IDB unavailable");
  });

  it("uses fallback error message when error has no message", async () => {
    const fs = createMockFS();
    (fs.getStorageStats as any).mockRejectedValue("unknown");
    const deps = createMockDependencies({ fs });
    const action$ = of(storageSlice.actions.refresh());

    const result = await firstValueFrom(
      fetchStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result.type).toBe("storage/refreshFailure");
    expect((result as any).payload.error).toBe(
      "Failed to read storage information"
    );
  });

  it("ignores unrelated actions", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const action$ = of(jobsSlice.actions.clear() as any);

    const results = await firstValueFrom(
      fetchStorageStatsEpic(action$, {} as any, deps).pipe(toArray())
    );

    expect(results).toEqual([]);
    expect(fs.getStorageStats).not.toHaveBeenCalled();
  });
});

describe("autoRefreshStorageStatsEpic", () => {
  it("emits storage/refresh on init/done", async () => {
    const action$ = of({ type: "init/done" } as any);
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on incDownloadStatus", async () => {
    const action$ = of(
      jobsSlice.actions.incDownloadStatus({ jobId: "j1" }) as any
    );
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on finishDownload", async () => {
    const action$ = of(
      jobsSlice.actions.finishDownload({ jobId: "j1" }) as any
    );
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on downloadFailed", async () => {
    const action$ = of(
      jobsSlice.actions.downloadFailed({
        jobId: "j1",
        message: "fail",
      }) as any
    );
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on deleteSuccess", async () => {
    const action$ = of(
      jobsSlice.actions.deleteSuccess({ jobId: "j1" }) as any
    );
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on queue", async () => {
    const action$ = of(jobsSlice.actions.queue({ jobId: "j1" }) as any);
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on cleanupSuccess", async () => {
    const action$ = of(storageSlice.actions.cleanupSuccess() as any);
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("emits storage/refresh on cleanupFailure", async () => {
    const action$ = of(
      storageSlice.actions.cleanupFailure({ error: "fail" }) as any
    );
    const deps = createMockDependencies();

    const result = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps)
    );

    expect(result).toEqual(storageSlice.actions.refresh());
  });

  it("ignores unrelated actions", async () => {
    const action$ = of(jobsSlice.actions.add({ job: createTestJob() }) as any);
    const deps = createMockDependencies();

    const results = await firstValueFrom(
      autoRefreshStorageStatsEpic(action$, {} as any, deps).pipe(toArray())
    );

    expect(results).toEqual([]);
  });
});

describe("cleanupStorageEpic", () => {
  it("cleans up with no active jobs and emits cleanupSuccess, clear, refresh", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const state = createMockState({ jobs: {}, jobsStatus: {} });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    expect(fs.cleanup).toHaveBeenCalled();
    expect(results).toEqual([
      storageSlice.actions.cleanupSuccess(),
      jobsSlice.actions.clear(),
      storageSlice.actions.refresh(),
    ]);
  });

  it("cancels downloading jobs before cleanup", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: {
        j1: createTestJob({ id: "j1" }),
      },
      jobsStatus: {
        j1: createTestJobStatus({ status: "downloading" }),
      },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    expect(results[0]).toEqual(jobsSlice.actions.cancel({ jobId: "j1" }));
    expect(results.slice(1)).toEqual([
      storageSlice.actions.cleanupSuccess(),
      jobsSlice.actions.clear(),
      storageSlice.actions.refresh(),
    ]);
  });

  it("cancels queued, saving, and ready jobs", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: {
        j1: createTestJob({ id: "j1" }),
        j2: createTestJob({ id: "j2" }),
        j3: createTestJob({ id: "j3" }),
      },
      jobsStatus: {
        j1: createTestJobStatus({ status: "queued" }),
        j2: createTestJobStatus({ status: "saving" }),
        j3: createTestJobStatus({ status: "ready" }),
      },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    const cancelActions = results.filter(
      (a) => a.type === "jobs/cancel"
    );
    const cancelledIds = cancelActions.map((a: any) => a.payload.jobId).sort();
    expect(cancelledIds).toEqual(["j1", "j2", "j3"]);
    expect(fs.cleanup).toHaveBeenCalled();
  });

  it("does not cancel done or error jobs", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: {
        j1: createTestJob({ id: "j1" }),
        j2: createTestJob({ id: "j2" }),
      },
      jobsStatus: {
        j1: createTestJobStatus({ status: "done" }),
        j2: { status: "error", total: 5, done: 0, saveProgress: 0, errorMessage: "fail" },
      },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    const cancelActions = results.filter((a) => a.type === "jobs/cancel");
    expect(cancelActions).toHaveLength(0);
    expect(results).toEqual([
      storageSlice.actions.cleanupSuccess(),
      jobsSlice.actions.clear(),
      storageSlice.actions.refresh(),
    ]);
  });

  it("emits cleanupFailure when fs.cleanup rejects", async () => {
    const fs = createMockFS();
    (fs.cleanup as any).mockRejectedValue(new Error("disk error"));
    const deps = createMockDependencies({ fs });
    const state = createMockState({ jobs: {}, jobsStatus: {} });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    expect(results).toEqual([
      storageSlice.actions.cleanupFailure({ error: "disk error" }),
    ]);
  });

  it("uses fallback error message when cleanup error has no message", async () => {
    const fs = createMockFS();
    (fs.cleanup as any).mockRejectedValue(null);
    const deps = createMockDependencies({ fs });
    const state = createMockState({ jobs: {}, jobsStatus: {} });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    expect(results).toEqual([
      storageSlice.actions.cleanupFailure({
        error: "Failed to clean IndexedDB storage",
      }),
    ]);
  });

  it("does not emit cleanupSuccess or clear on failure", async () => {
    const fs = createMockFS();
    (fs.cleanup as any).mockRejectedValue(new Error("boom"));
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: { j1: createTestJob({ id: "j1" }) },
      jobsStatus: { j1: createTestJobStatus({ status: "downloading" }) },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    const types = results.map((a) => a.type);
    expect(types).toContain("jobs/cancel");
    expect(types).toContain("storage/cleanupFailure");
    expect(types).not.toContain("storage/cleanupSuccess");
    expect(types).not.toContain("jobs/clear");
    expect(types).not.toContain("storage/refresh");
  });

  it("cancels active jobs then emits failure when cleanup fails", async () => {
    const fs = createMockFS();
    (fs.cleanup as any).mockRejectedValue(new Error("fail"));
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: { j1: createTestJob({ id: "j1" }) },
      jobsStatus: { j1: createTestJobStatus({ status: "downloading" }) },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    expect(results).toEqual([
      jobsSlice.actions.cancel({ jobId: "j1" }),
      storageSlice.actions.cleanupFailure({ error: "fail" }),
    ]);
  });

  it("handles null jobsStatus entries gracefully", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const state = createMockState({
      jobs: { j1: null },
      jobsStatus: { j1: null },
    });
    const action$ = of(storageSlice.actions.startCleanup());

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, { value: state } as any, deps).pipe(
        toArray()
      )
    );

    const cancelActions = results.filter((a) => a.type === "jobs/cancel");
    expect(cancelActions).toHaveLength(0);
    expect(fs.cleanup).toHaveBeenCalled();
  });

  it("ignores unrelated actions", async () => {
    const fs = createMockFS();
    const deps = createMockDependencies({ fs });
    const action$ = of(storageSlice.actions.refresh() as any);

    const results = await firstValueFrom(
      cleanupStorageEpic(action$, {} as any, deps).pipe(toArray())
    );

    expect(results).toEqual([]);
    expect(fs.cleanup).not.toHaveBeenCalled();
  });
});
