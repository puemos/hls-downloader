import { describe, it, expect } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { incDownloadStatusEpic } from "../src/controllers/inc-download-status-epic.ts";
import { jobsSlice } from "../src/store/slices/index.ts";

describe("incDownloadStatusEpic", () => {
  it("finishes and saves job when complete", async () => {
    const state = {
      jobs: { jobsStatus: { "1": { done: 1, total: 1 } }, jobs: {} },
    };
    const action$ = of(jobsSlice.actions.incDownloadStatus({ jobId: "1" }));
    const result = await firstValueFrom(
      incDownloadStatusEpic(action$, { value: state } as any, {} as any).pipe(
        toArray(),
      ),
    );
    expect(result).toEqual([
      jobsSlice.actions.finishDownload({ jobId: "1" }),
      jobsSlice.actions.saveAs({ jobId: "1" }),
    ]);
  });
});
