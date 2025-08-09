import { describe, it, expect, vi } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { saveAsJobEpic } from "../src/controllers/save-as-job-epic.ts";
import { jobsSlice } from "../src/store/slices/index.ts";
import { Job } from "../src/entities/index.ts";

describe("saveAsJobEpic", () => {
  it("saves job to file and emits success", async () => {
    const job = new Job("1", [], [], "file.mp4", Date.now());
    const fs = {
      getBucket: vi.fn().mockResolvedValue({
        getLink: vi.fn().mockResolvedValue("link"),
      }),
      saveAs: vi.fn().mockResolvedValue(undefined),
    };
    const action$ = of(jobsSlice.actions.saveAs({ jobId: "1" }));
    const state = {
      jobs: { jobs: { "1": job } },
      config: { saveDialog: true, proxyEnabled: false },
    };
    const result = await firstValueFrom(
      saveAsJobEpic(action$, { value: state } as any, { fs } as any)
    );
    expect(fs.saveAs).toHaveBeenCalledWith("file.mp4", "link", {
      dialog: true,
    });
    expect(result).toEqual(
      jobsSlice.actions.saveAsSuccess({ jobId: "1", link: "link" })
    );
  });
});
