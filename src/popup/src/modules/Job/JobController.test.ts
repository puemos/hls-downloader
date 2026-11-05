import { describe, expect, it } from "vitest";
import { buildJobViewDerived, SPEED_STALE_MS } from "./JobController";

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

describe("download speed display", () => {
  const now = 100_000;
  const downloading = (speed: Record<string, number> | undefined) => ({
    status: "downloading" as const,
    total: 10,
    done: 4,
    downloadedBytes: 4_000_000,
    speed: speed && {
      updatedAt: now,
      windowStartedAt: now,
      windowBytes: 0,
      ...speed,
    },
  });

  it("shows the speed and the time left from the fragments so far", () => {
    const derived = buildJobViewDerived(
      downloading({ bytesPerSecond: 1_000_000 }),
      undefined,
      undefined,
      now,
    );
    // 6 fragments left at 1 MB each, at 1 MB/s.
    expect(derived.speed).toEqual({
      bytesPerSecond: 1_000_000,
      secondsLeft: 6,
    });
  });

  it("prefers the remaining bytes from storage for the time left", () => {
    const derived = buildJobViewDerived(
      downloading({ bytesPerSecond: 1_000_000 }),
      {
        storedBytes: 4_000_000,
        expectedBytes: 12_000_000,
      } as any,
      undefined,
      now,
    );
    expect(derived.speed.secondsLeft).toBe(8);
  });

  it("waits for the first measurement", () => {
    const derived = buildJobViewDerived(
      downloading({}),
      undefined,
      undefined,
      now,
    );
    expect(derived.speed).toEqual({});
  });

  it("hides the speed once the download has stalled", () => {
    const status = downloading({ bytesPerSecond: 1_000_000 });
    expect(
      buildJobViewDerived(status, undefined, undefined, now + SPEED_STALE_MS)
        .speed.bytesPerSecond,
    ).toBe(1_000_000);
    expect(
      buildJobViewDerived(
        status,
        undefined,
        undefined,
        now + SPEED_STALE_MS + 1,
      ).speed,
    ).toEqual({});
  });

  it("only shows the speed while downloading", () => {
    const derived = buildJobViewDerived(
      { ...downloading({ bytesPerSecond: 1_000_000 }), status: "saving" },
      undefined,
      undefined,
      now,
    );
    expect(derived.speed).toEqual({});
  });
});
