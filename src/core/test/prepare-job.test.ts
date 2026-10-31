import { describe, expect, it, vi } from "vitest";
import { prepareJobFactory } from "../src/use-cases/prepare-job";
import {
  createMockDependencies,
  createTestFragment,
  createTestJob,
  createTestLevel,
  createTestPlaylist,
} from "./test-utils";

function setup() {
  const deps = createMockDependencies();
  const video = createTestLevel({ id: "video", uri: "video" });
  const audio = createTestLevel({ id: "audio", type: "audio", uri: "audio" });
  const vf = createTestFragment({ uri: "video.ts" }),
    af = createTestFragment({ uri: "audio.ts" });
  deps.parser.parseLevelPlaylist = vi.fn((_text, uri) =>
    uri === "video" ? [vf] : [af],
  );
  const job = {
    ...createTestJob({ videoFragments: [], audioFragments: [] }),
    source: { playlist: createTestPlaylist(), video, audio },
  };
  const prepare = prepareJobFactory(deps.loader, deps.parser, deps.decryptor);
  return { deps, job, vf, af, prepare };
}

describe("job preparation", () => {
  it("fetches selected video/audio manifests with the configured retry count", async () => {
    const { deps, job, prepare, vf, af } = setup();
    expect(await prepare(job, 3)).toMatchObject({
      id: job.id,
      videoFragments: [vf],
      audioFragments: [af],
    });
    expect(deps.loader.fetchText).toHaveBeenCalledWith("video", 3);
    expect(deps.loader.fetchText).toHaveBeenCalledWith("audio", 3);
  });
  it("does not invent a separate audio track when none was selected", async () => {
    const { deps, job, prepare } = setup();
    expect(
      await prepare({ ...job, source: { ...job.source, audio: undefined } }, 1),
    ).toMatchObject({ audioFragments: [] });
    expect(deps.loader.fetchText).toHaveBeenCalledTimes(1);
  });
  it("accepts a primary audio-only playlist", async () => {
    const { job, prepare, af } = setup();
    const prepared = await prepare(
      {
        ...job,
        source: { ...job.source, video: job.source.audio, audio: undefined },
      },
      1,
    );
    expect(prepared.videoFragments).toEqual([af]);
  });
  it("refetches manifest contents on retry instead of using stale fragments", async () => {
    const { deps, job, prepare } = setup();
    await prepare(job, 1);
    const fresh = createTestFragment({ uri: "fresh.ts" });
    deps.parser.parseLevelPlaylist = vi.fn().mockReturnValue([fresh]);
    expect((await prepare(job, 1)).videoFragments).toEqual([fresh]);
    expect(deps.loader.fetchText).toHaveBeenCalledTimes(4);
  });
  it("reads selected captions without writing them before the bucket exists", async () => {
    const { deps, job, prepare } = setup();
    const subtitle = {
      ...createTestLevel({ type: "subtitle", id: "en", uri: "captions" }),
      language: "en",
    };
    (deps.loader.fetchText as any).mockImplementation(async (uri: string) =>
      uri === "captions"
        ? "WEBVTT\n\n00:00.000 --> 00:01.000\nHello"
        : "#EXTM3U",
    );
    expect(
      await prepare({ ...job, source: { ...job.source, subtitle } }, 1),
    ).toMatchObject({
      subtitleLanguage: "en",
      subtitleText: expect.stringContaining("Hello"),
    });
    expect(deps.fs.setSubtitleText).not.toHaveBeenCalled();
  });
  it("keeps legacy persisted jobs usable without a source snapshot", async () => {
    const { deps, prepare } = setup();
    const job = createTestJob();
    expect(await prepare(job, 1)).toBe(job);
    expect(deps.loader.fetchText).not.toHaveBeenCalled();
  });
});
