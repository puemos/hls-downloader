import { describe, it, expect, vi } from "vitest";
import { of, firstValueFrom, Subject } from "rxjs";
import { downloadJobEpic } from "../src/controllers/download-job-epic.ts";
import { jobsSlice } from "../src/store/slices/index.ts";
import { Fragment, Key } from "../src/entities/index.ts";

describe("downloadJobEpic", () => {
  function setup() {
    const action$ = new Subject<any>();
    const job = (id: string) => ({
      id,
      videoFragments: [new Fragment(new Key(null, null), id, 0)],
      audioFragments: [],
    });
    const write = vi.fn().mockResolvedValue(undefined);
    const fs = {
      createBucket: vi.fn().mockResolvedValue(undefined),
      getBucket: vi.fn().mockResolvedValue({ write }),
      deleteBucket: vi.fn().mockResolvedValue(undefined),
    };
    const loader = {
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)),
    };
    const state = {
      config: { concurrency: 1, fetchAttempts: 2 },
      jobs: { jobs: { one: job("one"), two: job("two") } },
    };
    const actions: any[] = [];
    const errors: unknown[] = [];
    const subscription = downloadJobEpic(
      action$,
      { value: state } as any,
      { fs, loader, decryptor: { decrypt: vi.fn() } } as any,
    ).subscribe({
      next: (action) => actions.push(action),
      error: (error) => errors.push(error),
    });
    return { action$, fs, loader, write, actions, errors, subscription };
  }

  it("reports bucket creation failure without disabling later downloads (#410)", async () => {
    const test = setup();
    test.fs.createBucket.mockRejectedValueOnce(
      new Error("Disk temporarily unavailable"),
    );
    test.action$.next(jobsSlice.actions.download({ jobId: "one" }));
    await vi.waitFor(() =>
      expect(test.actions).toContainEqual(
        jobsSlice.actions.downloadFailed({
          jobId: "one",
          message: "Disk temporarily unavailable",
        }),
      ),
    );
    test.action$.next(jobsSlice.actions.download({ jobId: "two" }));
    await vi.waitFor(() =>
      expect(test.actions).toContainEqual(
        jobsSlice.actions.incDownloadStatus({ jobId: "two" }),
      ),
    );
    expect(test.errors).toEqual([]);
    test.subscription.unsubscribe();
  });

  it.each(["cancel", "delete", "clear"] as const)(
    "%s aborts pending network requests and prevents late writes (#410)",
    async (action) => {
      const test = setup();
      let resolve!: (bytes: ArrayBuffer) => void;
      test.loader.fetchArrayBuffer.mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      );
      test.action$.next(jobsSlice.actions.download({ jobId: "one" }));
      await vi.waitFor(() =>
        expect(test.loader.fetchArrayBuffer).toHaveBeenCalledTimes(1),
      );
      const signal = test.loader.fetchArrayBuffer.mock
        .calls[0][3] as AbortSignal;
      test.action$.next(
        action === "clear"
          ? jobsSlice.actions.clear()
          : jobsSlice.actions[action]({ jobId: "one" }),
      );
      expect(signal?.aborted).toBe(true);
      resolve(new ArrayBuffer(1));
      await new Promise((done) => setTimeout(done, 0));
      expect(test.write).not.toHaveBeenCalled();
      expect(test.actions).toEqual([]);
      test.subscription.unsubscribe();
    },
  );

  it("cancellation of one job leaves another job running", async () => {
    const test = setup();
    let resolve!: (bytes: ArrayBuffer) => void;
    test.loader.fetchArrayBuffer.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    test.action$.next(jobsSlice.actions.download({ jobId: "one" }));
    await vi.waitFor(() =>
      expect(test.loader.fetchArrayBuffer).toHaveBeenCalledTimes(1),
    );
    test.action$.next(jobsSlice.actions.cancel({ jobId: "two" }));
    const signal = test.loader.fetchArrayBuffer.mock.calls[0][3] as AbortSignal;
    expect(signal?.aborted ?? false).toBe(false);
    resolve(new ArrayBuffer(1));
    await vi.waitFor(() =>
      expect(test.actions).toContainEqual(
        jobsSlice.actions.incDownloadStatus({ jobId: "one" }),
      ),
    );
    test.subscription.unsubscribe();
  });

  it("cleans up a bucket that finishes creating after cancellation", async () => {
    const test = setup();
    let created!: () => void;
    test.fs.createBucket.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          created = done;
        }),
    );
    test.action$.next(jobsSlice.actions.download({ jobId: "one" }));
    await vi.waitFor(() =>
      expect(test.fs.createBucket).toHaveBeenCalledTimes(1),
    );
    test.action$.next(jobsSlice.actions.cancel({ jobId: "one" }));
    created();
    await vi.waitFor(() =>
      expect(test.fs.deleteBucket).toHaveBeenCalledWith("one"),
    );
    expect(test.loader.fetchArrayBuffer).not.toHaveBeenCalled();
    expect(test.actions).toEqual([]);
    test.subscription.unsubscribe();
  });

  it("downloads fragments and reports progress", async () => {
    const fragment = new Fragment(new Key(null, null), "f", 0);
    const job = {
      id: "1",
      videoFragments: [fragment],
      audioFragments: [],
      filename: "file.mp4",
      createdAt: Date.now(),
      bitrate: 1000,
      width: 640,
      height: 360,
    };
    const fs = {
      createBucket: vi.fn().mockResolvedValue(undefined),
      getBucket: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(undefined),
      }),
    };
    const loader = {
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
    const decryptor = { decrypt: vi.fn() };
    const action$ = of(jobsSlice.actions.download({ jobId: "1" }));
    const state = {
      config: { concurrency: 1, fetchAttempts: 1 },
      jobs: {
        jobs: { "1": job },
        jobsStatus: {
          "1": { status: "queued", total: 1, done: 0 },
        },
      },
    };
    const result = await firstValueFrom(
      downloadJobEpic(
        action$,
        { value: state } as any,
        {
          fs,
          loader,
          decryptor,
        } as any,
      ),
    );
    expect(fs.createBucket).toHaveBeenCalledWith("1", 1, 0);
    expect(result).toEqual(jobsSlice.actions.incDownloadStatus({ jobId: "1" }));
  });
});
