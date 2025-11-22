import { describe, it, expect, vi, beforeEach } from "vitest";
import { firstValueFrom } from "rxjs";
import { addDownloadJobEpic } from "../src/controllers/add-download-job-epic.ts";
import { levelsSlice } from "../src/store/slices/levels-slice.ts";
import { jobsSlice } from "../src/store/slices/index.ts";
import {
  createTestLevel,
  createTestPlaylist,
  createTestFragment,
  createMockState,
  createMockLoader,
  createMockParser,
  toObservable,
} from "./test-utils";

describe("addDownloadJobEpic", () => {
  // Setup test fixtures
  let videoLevel;
  let audioLevel;
  let playlist;
  let videoFragment;
  let audioFragment;
  let mockLoader;
  let mockParser;
  let mockState;

  beforeEach(() => {
    // Create test entities using the test utils
    videoLevel = createTestLevel({
      id: "v",
      playlistID: "p",
      uri: "video",
      width: 1920,
      height: 1080,
      bitrate: 1000,
    });

    audioLevel = createTestLevel({
      id: "a",
      playlistID: "p",
      uri: "audio",
      type: "audio",
    });

    playlist = createTestPlaylist({
      id: "p",
      uri: "http://example.com/master.m3u8",
      pageTitle: "page",
    });

    videoFragment = createTestFragment({ uri: "vf", index: 0 });
    audioFragment = createTestFragment({ uri: "af", index: 0 });

    // Create mock services
    mockLoader = createMockLoader();
    mockParser = createMockParser();

    // Configure mock parser to return different fragments based on URI
    mockParser.parseLevelPlaylist = vi
      .fn()
      .mockImplementation((_text, uri) =>
        uri === "video" ? [videoFragment] : [audioFragment],
      );

    // Create mock state
    mockState = createMockState({
      levels: { v: videoLevel, a: audioLevel },
      playlists: { p: playlist },
      fetchAttempts: 1,
    });
  });

  it("creates a download job for video and audio levels", async () => {
    // Setup
    const action$ = toObservable(
      levelsSlice.actions.download({ levelID: "v", audioLevelID: "a" }),
    );
    const deps = { loader: mockLoader, parser: mockParser };

    // Execute
    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any),
    );

    // Verify
    expect(result.type).toBe(jobsSlice.actions.add.type);
    expect(result).toHaveProperty("payload");
    expect((result as any).payload).toBeDefined();

    const { job } = (result as any).payload;
    expect(job).toMatchObject({
      filename: "page-master.mp4",
      videoFragments: [videoFragment],
      audioFragments: [audioFragment],
      bitrate: 1000,
      width: 1920,
      height: 1080,
    });

    expect(job.id).toBeTypeOf("string");
    expect(job.id.length).toBeGreaterThan(0);
    expect(job.createdAt).toBeTypeOf("number");

    // Verify service calls
    expect(mockLoader.fetchText).toHaveBeenCalledWith("video", 1);
    expect(mockLoader.fetchText).toHaveBeenCalledWith("audio", 1);
    expect(mockParser.parseLevelPlaylist).toHaveBeenCalledTimes(2);
  });

  it("creates a download job for video only when no audio level is provided", async () => {
    // Setup
    const action$ = toObservable(
      levelsSlice.actions.download({ levelID: "v" }),
    );
    const deps = { loader: mockLoader, parser: mockParser };

    // Execute
    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any),
    );

    // Verify
    expect(result.type).toBe(jobsSlice.actions.add.type);
    expect(result).toHaveProperty("payload");

    const { job } = (result as any).payload;
    expect(job.videoFragments).toEqual([videoFragment]);
    expect(job.audioFragments).toEqual([]);

    // Verify service calls - should only call for video
    expect(mockLoader.fetchText).toHaveBeenCalledWith("video", 1);
    expect(mockLoader.fetchText).toHaveBeenCalledTimes(1);
    expect(mockParser.parseLevelPlaylist).toHaveBeenCalledTimes(1);
  });

  it("uses the correct fetch attempts from config", async () => {
    // Setup - configure fetch attempts
    mockState.config.fetchAttempts = 3;
    const action$ = toObservable(
      levelsSlice.actions.download({ levelID: "v", audioLevelID: "a" }),
    );
    const deps = { loader: mockLoader, parser: mockParser };
    // Execute
    await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any),
    );
    // Verify that loader uses the configured fetch attempts
    expect(mockLoader.fetchText).toHaveBeenCalledWith("video", 3);
    expect(mockLoader.fetchText).toHaveBeenCalledWith("audio", 3);
  });

  it("generates correct filename from playlist information", async () => {
    // Setup - different playlist title
    playlist.pageTitle = "My Custom Title";
    const action$ = toObservable(
      levelsSlice.actions.download({ levelID: "v" }),
    );
    const deps = { loader: mockLoader, parser: mockParser };
    // Execute
    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any),
    );

    // Verify filename contains the custom title
    expect(result.type).toBe(jobsSlice.actions.add.type);
    expect((result as any).payload.job.filename).toBe(
      "My Custom Title-master.mp4",
    );
  });

  it("handles errors when fetching fragments", async () => {
    // Setup - configure loader to fail
    mockLoader.fetchText = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const action$ = toObservable(
      levelsSlice.actions.download({ levelID: "v" }),
    );
    const deps = { loader: mockLoader, parser: mockParser };
    // Verify that the epic completes without throwing
    const promise = firstValueFrom(
      addDownloadJobEpic(action$, { value: mockState } as any, deps as any),
    );
    // The epic should complete with an empty result or an error action
    await expect(promise).rejects.toThrow();
  });
});
