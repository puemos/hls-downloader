import { describe, it, expect, vi } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { deleteJobEpic } from "../src/controllers/delete-job-epic.ts";
import { jobsSlice } from "../src/store/slices/index.ts";

describe("deleteJobEpic", () => {
  it("deletes job bucket and emits success", async () => {
    const fs = { deleteBucket: vi.fn().mockResolvedValue(undefined) };
    const action$ = of(jobsSlice.actions.delete({ jobId: "1" }));
    const result = await firstValueFrom(
      deleteJobEpic(action$, {} as any, { fs } as any),
    );
    expect(fs.deleteBucket).toHaveBeenCalledWith("1");
    expect(result).toEqual(jobsSlice.actions.deleteSuccess({ jobId: "1" }));
  });
});
