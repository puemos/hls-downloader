import { describe, it, expect } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { downloadQueueEpic } from "../src/controllers/download-queue-epic";
import { jobsSlice } from "../src/store/slices";
import { createMockState, createTestJob } from "./test-utils";

describe("downloadQueueEpic", () => {
  it("starts the oldest queued job when slots are available", async () => {
    const job1 = createTestJob({ id: "job1" });
    const job2 = createTestJob({ id: "job2" });
    const job1Total = job1.videoFragments.length + job1.audioFragments.length;
    const job2Total = job2.videoFragments.length + job2.audioFragments.length;
    const state = createMockState({
      jobs: { job1, job2 },
      jobsStatus: {
        job1: { status: "queued", total: job1Total, done: 0 },
        job2: { status: "queued", total: job2Total, done: 0 },
      },
      maxActiveDownloads: 1,
    });
    const action$ = of(jobsSlice.actions.add({ job: job2 }));

    const result = await firstValueFrom(
      downloadQueueEpic(action$, { value: state } as any, {} as any).pipe(
        toArray()
      )
    );

    expect(result).toEqual([jobsSlice.actions.download({ jobId: "job1" })]);
  });

  it("starts all queued jobs when limit is unlimited", async () => {
    const job1 = createTestJob({ id: "job1" });
    const job2 = createTestJob({ id: "job2" });
    const job1Total = job1.videoFragments.length + job1.audioFragments.length;
    const job2Total = job2.videoFragments.length + job2.audioFragments.length;
    const state = createMockState({
      jobs: { job1, job2 },
      jobsStatus: {
        job1: { status: "queued", total: job1Total, done: 0 },
        job2: { status: "queued", total: job2Total, done: 0 },
      },
      maxActiveDownloads: 0,
    });
    const action$ = of(jobsSlice.actions.queue({ jobId: job1.id }));

    const result = await firstValueFrom(
      downloadQueueEpic(action$, { value: state } as any, {} as any).pipe(
        toArray()
      )
    );

    expect(result).toEqual([
      jobsSlice.actions.download({ jobId: "job1" }),
      jobsSlice.actions.download({ jobId: "job2" }),
    ]);
  });

  it("does nothing when active downloads meet the limit", async () => {
    const job1 = createTestJob({ id: "job1" });
    const job2 = createTestJob({ id: "job2" });
    const job1Total = job1.videoFragments.length + job1.audioFragments.length;
    const job2Total = job2.videoFragments.length + job2.audioFragments.length;
    const state = createMockState({
      jobs: { job1, job2 },
      jobsStatus: {
        job1: { status: "downloading", total: job1Total, done: 0 },
        job2: { status: "queued", total: job2Total, done: 0 },
      },
      maxActiveDownloads: 1,
    });
    const action$ = of(jobsSlice.actions.add({ job: job2 }));

    const result = await firstValueFrom(
      downloadQueueEpic(action$, { value: state } as any, {} as any).pipe(
        toArray()
      )
    );

    expect(result).toEqual([]);
  });
});
