import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { addDownloadJobEpic } from "../src/controllers/add-download-job-epic.ts";
import { levelsSlice } from "../src/store/slices/levels-slice.ts";
import { jobsSlice } from "../src/store/slices/index.ts";
import { Playlist, Level, Fragment, Key } from "../src/entities/index.ts";

describe("addDownloadJobEpic", () => {
  let videoLevel: Level;
  let audioLevel: Level;
  let playlist: Playlist;
  let videoFragment: Fragment;
  let audioFragment: Fragment;
  let mockLoader: { fetchText: ReturnType<typeof vi.fn> };
  let mockParser: { parseLevelPlaylist: ReturnType<typeof vi.fn> };
  let mockState: any;

  beforeEach(() => {
    videoLevel = new Level("stream", "v", "p", "video", 1920, 1080, 1000);
    audioLevel = new Level("audio", "a", "p", "audio");
    playlist = new Playlist(
      "p",
      "http://example.com/master.m3u8",
      Date.now(),
      "page"
    );
    videoFragment = new Fragment(new Key(null, null), "vf", 0);
    audioFragment = new Fragment(new Key(null, null), "af", 0);

    mockLoader = { fetchText: vi.fn().mockResolvedValue("") };
    mockParser = {
      parseLevelPlaylist: vi
        .fn()
        .mockImplementation((_text, uri) =>
          uri === "video" ? [videoFragment] : [audioFragment]
        ),
    };

    mockState = {
      levels: { levels: { v: videoLevel, a: audioLevel } },
      playlists: { playlists: { p: playlist } },
      config: { fetchAttempts: 1, concurrency: 2, saveDialog: false },
      tabs: { current: { id: -1 } },
      jobs: { jobs: {}, jobsStatus: {} },
    };
  });

  it("creates a download job for video and audio levels", async () => {
    const action$ = of(
      levelsSlice.actions.download({ levelID: "v", audioLevelID: "a" })
    );
    const deps = { loader: mockLoader, parser: mockParser };

    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any)
    );

    expect(result.type).toBe(jobsSlice.actions.add.type);

    if ("payload" in result) {
      expect(result.payload.job.filename).toBe("page-master.mp4");
      expect(result.payload.job.videoFragments).toEqual([videoFragment]);
      expect(result.payload.job.audioFragments).toEqual([audioFragment]);
      expect(result.payload.job.bitrate).toBe(1000);
      expect(result.payload.job.width).toBe(1920);
      expect(result.payload.job.height).toBe(1080);
      expect(result.payload.job.id).toMatch(/^page-master.mp4\//);
      expect(result.payload.job.createdAt).toBeTypeOf("number");
    }
  });

  it("creates a download job for video only when no audio level is provided", async () => {
    const action$ = of(levelsSlice.actions.download({ levelID: "v" }));
    const deps = { loader: mockLoader, parser: mockParser };

    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any)
    );

    expect(result.type).toBe(jobsSlice.actions.add.type);

    if ("payload" in result) {
      expect(result.payload.job.videoFragments).toEqual([videoFragment]);
      expect(result.payload.job.audioFragments).toEqual([]);
    }
  });

  it("uses the correct fetch attempts from config", async () => {
    mockState.config.fetchAttempts = 3;
    const action$ = of(
      levelsSlice.actions.download({ levelID: "v", audioLevelID: "a" })
    );
    const deps = { loader: mockLoader, parser: mockParser };

    await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any)
    );

    expect(mockLoader.fetchText).toHaveBeenCalled();
  });
});
