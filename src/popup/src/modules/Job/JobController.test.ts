import { describe, expect, it } from "vitest";
import { buildJobViewDerived } from "./JobController";

describe("job preparation display", () => {
  it("shows preparation as active and cancellable with no media progress yet", () => {
    const derived = buildJobViewDerived({
      status: "preparing",
      total: 0,
      done: 0,
    });
    expect(derived).toMatchObject({
      headerStatusLabel: "Preparing",
      statusKind: "active",
      isDownloading: true,
      isReady: false,
      percent: 0,
      progress: { total: 0, done: 0, percent: 0 },
    });
  });
});
