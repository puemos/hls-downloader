import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import {
  jobsSlice,
  levelsSlice,
  playlistsSlice,
} from "@hls-downloader/core/lib/store/slices";
import { createMockFS, createMockState } from "../../core/test/test-utils";
import { FetchLoader } from "../src/services/fetch-loader";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { CryptoDecryptor } from "../src/services/crypto-decryptor";

let server: http.Server;
let base: string;
let fault = "";
let releaseEmpty: (() => void) | undefined;
const reads: string[] = [];
const closed: string[] = [];
const stores: ReturnType<typeof createStore>[] = [];
const bytes = Object.fromEntries(
  ["video", "audio"].map((track) => [
    track,
    fs.readFileSync(path.join(__dirname, "fixtures", `${track}-only.ts`)),
  ]),
);
const captions = "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nA caption\n";

beforeAll(async () => {
  server = http.createServer(async (request, response) => {
    const name = new URL(request.url!, "http://localhost").pathname.slice(1);
    reads.push(name);
    const track = name.split(".")[0];
    if (fault.split("+").includes(`stall-${track}`) && name.endsWith(".m3u8")) {
      response.writeHead(200);
      response.flushHeaders();
      response.write("#EXTM3U\n");
      releaseEmpty?.();
      releaseEmpty = undefined;
      response.on("close", () => closed.push(track));
      return;
    }
    if (fault.split("+").includes(`fail-${track}`) && name.endsWith(".m3u8")) {
      response.writeHead(403);
      response.end("Expired");
      return;
    }
    if (name.endsWith(".m3u8")) {
      // Ensure the sibling response is open before sending the empty playlist.
      if (
        fault === "empty-video+stall-captions" &&
        track === "video" &&
        !reads.includes("captions.m3u8")
      )
        await new Promise<void>((resolve) => {
          releaseEmpty = resolve;
        });
      const body = fault.split("+").includes(`empty-${track}`)
        ? "#EXTM3U\n#EXT-X-ENDLIST\n"
        : `#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\n${track}.${track === "captions" ? "vtt" : "ts"}\n#EXT-X-ENDLIST\n`;
      response.end(body);
      return;
    }
    response.end(name === "captions.vtt" ? captions : bytes[track]);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterEach(async () => {
  for (const store of stores.splice(0))
    store.dispatch(jobsSlice.actions.clear());
  server.closeAllConnections();
  releaseEmpty?.();
  releaseEmpty = undefined;
  fault = "";
  await new Promise((resolve) => setTimeout(resolve, 10));
  reads.length = 0;
  closed.length = 0;
});
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

function setup() {
  const playlist = { id: "p", uri: `${base}/master.m3u8`, createdAt: 1 };
  const levels = Object.fromEntries(
    ["video", "audio", "captions"].map((track) => [
      track,
      {
        type:
          track === "video"
            ? "stream"
            : track === "audio"
              ? "audio"
              : "subtitle",
        id: track,
        playlistID: "p",
        uri: `${base}/${track}.m3u8`,
        language: "en",
      },
    ]),
  );
  const fs = createMockFS();
  const store = createStore(
    { fs, loader: FetchLoader, parser: M3u8Parser, decryptor: CryptoDecryptor },
    createMockState({
      playlists: { p: playlist },
      levels: levels as any,
      fetchAttempts: 1,
      maxActiveDownloads: 1,
    }),
  );
  stores.push(store);
  const start = (subtitle = false) =>
    store.dispatch(
      levelsSlice.actions.download({
        levelID: "video",
        audioLevelID: "audio",
        ...(subtitle ? { subtitleLevelID: "captions" } : {}),
      }),
    );
  return { store, fs, start };
}
const wait = (assertion: () => unknown) =>
  vi.waitFor(assertion, { timeout: 800, interval: 10 });
function oneJob(store: ReturnType<typeof createStore>) {
  const jobs = Object.values(store.getState().jobs.jobs).filter(Boolean);
  expect(jobs).toHaveLength(1);
  return jobs[0]!;
}

describe("preparation failures, cancellation, and retries with real HTTP playlists", () => {
  it.each(["video", "audio", "captions"])(
    "keeps a %s manifest failure visible and retries the same job",
    async (track) => {
      const test = setup();
      fault = `fail-${track}`;
      test.start(track === "captions");
      await wait(() => {
        const job = oneJob(test.store);
        expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
          "error",
        );
      });
      const job = oneJob(test.store);
      expect(test.fs.createBucket).not.toHaveBeenCalled();
      fault = "";
      test.store.dispatch(jobsSlice.actions.queue({ jobId: job.id }));
      await wait(() =>
        expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
          "done",
        ),
      );
      expect(oneJob(test.store).id).toBe(job.id);
      expect(test.fs.saveAs).toHaveBeenCalledTimes(1);
    },
  );
  it.each(["video", "audio", "captions"])(
    "cancels a stalled %s manifest and closes its HTTP response",
    async (track) => {
      const test = setup();
      fault = `stall-${track}`;
      test.start(track === "captions");
      await wait(() => expect(reads).toContain(`${track}.m3u8`));
      const job = oneJob(test.store);
      expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
        "preparing",
      );
      test.store.dispatch(jobsSlice.actions.cancel({ jobId: job.id }));
      await wait(() => expect(closed).toContain(track));
      expect(test.fs.createBucket).not.toHaveBeenCalled();
      await wait(() =>
        expect(Object.values(test.store.getState().jobs.jobs)).toHaveLength(0),
      );
    },
  );
  it.each(["video", "audio"])(
    "rejects an empty selected %s playlist instead of hanging or exporting an incomplete track",
    async (track) => {
      const test = setup();
      fault = `empty-${track}`;
      test.start();
      await wait(() => {
        const job = oneJob(test.store);
        expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
          "error",
        );
      });
      expect(test.fs.createBucket).not.toHaveBeenCalled();
      expect(test.fs.saveAs).not.toHaveBeenCalled();
      const job = oneJob(test.store);
      fault = "";
      test.store.dispatch(jobsSlice.actions.queue({ jobId: job.id }));
      await wait(() =>
        expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
          "done",
        ),
      );
    },
  );
  it("retains the selected source when capture lists are cleared during preparation", async () => {
    const test = setup();
    fault = "stall-video";
    test.start();
    await wait(() => expect(reads).toContain("video.m3u8"));
    const job = oneJob(test.store);
    test.store.dispatch(levelsSlice.actions.clear());
    test.store.dispatch(playlistsSlice.actions.clearPlaylists());
    test.store.dispatch(jobsSlice.actions.cancel({ jobId: job.id }));
    await wait(() => expect(closed).toContain("video"));
    expect(Object.values(test.store.getState().jobs.jobs)).toHaveLength(0);
  });
  it("counts preparation against the download limit and starts the next job after cancellation", async () => {
    const test = setup();
    fault = "stall-video";
    test.start();
    test.start();
    await wait(() => expect(reads).toContain("video.m3u8"));
    const jobs = Object.values(test.store.getState().jobs.jobs).filter(Boolean);
    expect(jobs).toHaveLength(2);
    const first = jobs.find(
      (job) =>
        test.store.getState().jobs.jobsStatus[job!.id]?.status === "preparing",
    )!;
    expect(
      Object.values(test.store.getState().jobs.jobsStatus).filter(
        (status) => status?.status === "queued",
      ),
    ).toHaveLength(1);
    expect(reads.filter((name) => name === "video.m3u8")).toHaveLength(1);
    fault = "";
    test.store.dispatch(jobsSlice.actions.cancel({ jobId: first.id }));
    await wait(() =>
      expect(
        Object.values(test.store.getState().jobs.jobsStatus).some(
          (status) => status?.status === "done",
        ),
      ).toBe(true),
    );
    expect(test.fs.saveAs).toHaveBeenCalledTimes(1);
  });
  it("ignores duplicate Retry actions while the same job is preparing", async () => {
    const test = setup();
    fault = "stall-video";
    test.start();
    await wait(() => expect(reads).toContain("video.m3u8"));
    const job = oneJob(test.store);
    test.store.dispatch(jobsSlice.actions.queue({ jobId: job.id }));
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(reads.filter((name) => name === "video.m3u8")).toHaveLength(1);
  });
  it("rejects an empty stream promptly and aborts a stalled sibling caption request", async () => {
    const test = setup();
    fault = "empty-video+stall-captions";
    test.start(true);
    await wait(() => {
      const job = oneJob(test.store);
      expect(test.store.getState().jobs.jobsStatus[job.id]?.status).toBe(
        "error",
      );
    });
    await wait(() => expect(closed).toContain("captions"));
    expect(test.fs.createBucket).not.toHaveBeenCalled();
  });
});
