import { describe, expect, it } from "vitest";
import { firstValueFrom, of, toArray } from "rxjs";
import { addDownloadJobEpic } from "../src/controllers/add-download-job-epic";
import { levelsSlice, jobsSlice } from "../src/store/slices";
import {
  createMockDependencies,
  createMockState,
  createTestLevel,
  createTestPlaylist,
} from "./test-utils";

function setup(container: "mp4" | "mkv" = "mp4") {
  const playlist = createTestPlaylist({
    id: "p",
    uri: "https://example.com/master.m3u8",
    pageTitle: "Episode",
  });
  const video = createTestLevel({ id: "v", playlistID: "p", uri: "video" });
  const audio = createTestLevel({
    id: "a",
    type: "audio",
    playlistID: "p",
    uri: "audio",
  });
  const subtitle = createTestLevel({
    id: "s",
    type: "subtitle",
    playlistID: "p",
    uri: "captions",
  });
  return {
    playlist,
    video,
    audio,
    subtitle,
    deps: createMockDependencies(),
    state: createMockState({
      playlists: { p: playlist },
      levels: { v: video, a: audio, s: subtitle },
      outputContainer: container,
    }),
  };
}
async function create(test: ReturnType<typeof setup>, subtitles = false) {
  return firstValueFrom(
    addDownloadJobEpic(
      of(
        levelsSlice.actions.download({
          levelID: "v",
          audioLevelID: "a",
          ...(subtitles ? { subtitleLevelID: "s" } : {}),
        }),
      ),
      { value: test.state } as any,
      test.deps,
    ),
  );
}

describe("job creation before preparation", () => {
  it("creates a visible queued job and retains the selection without network or filesystem work", async () => {
    const test = setup();
    const action = await create(test);
    expect(jobsSlice.actions.add.match(action)).toBe(true);
    const job = (action as any).payload.job;
    expect(job).toMatchObject({
      videoFragments: [],
      audioFragments: [],
      source: { playlist: test.playlist, video: test.video, audio: test.audio },
    });
    const state = jobsSlice.reducer(undefined, action);
    expect(state.jobs[job.id]).toEqual(job);
    expect(state.jobsStatus[job.id]?.status).toBe("queued");
    expect(test.deps.loader.fetchText).not.toHaveBeenCalled();
    expect(test.deps.fs.setSubtitleText).not.toHaveBeenCalled();
  });
  it.each(["mp4", "mkv"] as const)(
    "preserves the configured %s filename and output",
    async (container) => {
      const action = await create(setup(container));
      expect((action as any).payload.job).toMatchObject({
        filename: `Episode-master.${container}`,
        outputContainer: container,
      });
    },
  );
  it("retains subtitle selection and forces MKV before preparation", async () => {
    const test = setup();
    const action = await create(test, true);
    expect((action as any).payload.job).toMatchObject({
      filename: "Episode-master.mkv",
      outputContainer: "mkv",
      source: { subtitle: test.subtitle },
    });
  });
  it("does not disable later selections after a missing playlist", async () => {
    const test = setup();
    const actions = await firstValueFrom(
      addDownloadJobEpic(
        of(
          levelsSlice.actions.download({ levelID: "missing" }),
          levelsSlice.actions.download({ levelID: "v" }),
        ),
        { value: test.state } as any,
        test.deps,
      ).pipe(toArray()),
    );
    expect(actions.map((action) => action.type)).toEqual([
      jobsSlice.actions.downloadFailed.type,
      jobsSlice.actions.add.type,
    ]);
  });
});
