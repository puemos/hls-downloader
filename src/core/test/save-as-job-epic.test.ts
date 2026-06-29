import { describe, it, expect, vi } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { saveAsJobEpic } from "../src/controllers/save-as-job-epic.ts";
import { jobsSlice } from "../src/store/slices/index.ts";
import { Job } from "../src/entities/index.ts";

describe("saveAsJobEpic", () => {
  it("saves job to file and emits success", async () => {
    const job = new Job("1", "p1", [], [], "file.mp4", Date.now());
    const getLink = vi.fn().mockResolvedValue("link");
    const fs = {
      getBucket: vi.fn().mockResolvedValue({
        getLink,
      }),
      saveAs: vi.fn().mockResolvedValue(undefined),
    };
    const action$ = of(jobsSlice.actions.saveAs({ jobId: "1" }));
    const state = {
      jobs: { jobs: { "1": job } },
      config: { saveDialog: true },
    };
    const result = await firstValueFrom(
      saveAsJobEpic(action$, { value: state } as any, { fs } as any)
    );
    expect(fs.saveAs).toHaveBeenCalledWith("file.mp4", "link", {
      dialog: true,
    });
    expect(getLink).toHaveBeenCalledWith(expect.any(Function), {
      container: "mp4",
    });
    expect(result).toEqual(
      jobsSlice.actions.saveAsSuccess({ jobId: "1", link: "link" })
    );
  });

  it("passes stored mkv output container when creating the save link", async () => {
    const job = {
      id: "1",
      playlistId: "p1",
      videoFragments: [],
      audioFragments: [],
      filename: "file.mkv",
      createdAt: Date.now(),
      outputContainer: "mkv" as const,
    };
    const getLink = vi.fn().mockResolvedValue("link");
    const fs = {
      getBucket: vi.fn().mockResolvedValue({
        getLink,
      }),
      saveAs: vi.fn().mockResolvedValue(undefined),
    };
    const action$ = of(jobsSlice.actions.saveAs({ jobId: "1" }));
    const state = {
      jobs: { jobs: { "1": job } },
      config: { saveDialog: false },
    };

    await firstValueFrom(
      saveAsJobEpic(action$, { value: state } as any, { fs } as any)
    );

    expect(getLink).toHaveBeenCalledWith(expect.any(Function), {
      container: "mkv",
    });
  });
});
