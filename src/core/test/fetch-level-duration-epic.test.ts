import { describe, expect, it, vi } from "vitest";
import { firstValueFrom, of, toArray } from "rxjs";
import { fetchLevelDurationEpic } from "../src/controllers/fetch-level-duration-epic";
import { levelsSlice } from "../src/store/slices";

const subtitle = {
  type: "subtitle" as const,
  id: "caption",
  playlistID: "https://origin.test/master.m3u8",
  uri: "https://cdn.test/once.vtt",
};
const state = {
  value: { config: { fetchAttempts: 1 }, levels: { durations: {} } },
};

describe("playlist duration prefetch", () => {
  it("does not consume caption URLs while estimating video size", async () => {
    const loader = { fetchText: vi.fn().mockResolvedValue("WEBVTT\n") };
    const output = await firstValueFrom(
      fetchLevelDurationEpic(
        of(levelsSlice.actions.add({ levels: [subtitle] })),
        state as any,
        { loader } as any,
      ).pipe(toArray()),
    );
    expect(loader.fetchText).not.toHaveBeenCalled();
    expect(output).toEqual([]);
  });
  it("uses the redirected master's query parameters for duration estimates", async () => {
    const stream = {
      ...subtitle,
      type: "stream" as const,
      id: "video",
      uri: "https://cdn.test/video.m3u8",
      baseUri: "https://cdn.test/master.m3u8?token=new",
    };
    const loader = {
      fetchText: vi.fn().mockResolvedValue("#EXTM3U\n#EXTINF:8,\nsegment.ts\n"),
    };
    const output = await firstValueFrom(
      fetchLevelDurationEpic(
        of(levelsSlice.actions.add({ levels: [stream] })),
        state as any,
        { loader } as any,
      ).pipe(toArray()),
    );
    expect(loader.fetchText).toHaveBeenCalledWith(
      "https://cdn.test/video.m3u8?token=new",
      1,
    );
    expect(output).toContainEqual(
      levelsSlice.actions.setDuration({ levelId: "video", durationSec: 8 }),
    );
  });
});
