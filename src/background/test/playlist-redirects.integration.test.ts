import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createCipheriv } from "node:crypto";
import {
  getLevelsFactory,
  getFragmentsDetailsFactory,
  getSubtitleTextFactory,
  inspectLevelEncryptionFactory,
  downloadSingleFactory,
  decryptSingleFragmentFactory,
} from "@hls-downloader/core/lib/use-cases";
import { FetchLoader } from "../src/services/fetch-loader";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { CryptoDecryptor } from "../src/services/crypto-decryptor";

const key = Buffer.alloc(16, 7);
const captions =
  "WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nA complete caption\n";
const source = Object.fromEntries(
  ["video", "audio"].map((track) => [
    track,
    fs.readFileSync(path.join(__dirname, "fixtures", `${track}-only.ts`)),
  ]),
);
const encrypted = Object.fromEntries(
  Object.entries(source).map(([track, bytes]) => {
    const cipher = createCipheriv("aes-128-cbc", key, Buffer.alloc(16));
    return [track, Buffer.concat([cipher.update(bytes), cipher.final()])];
  }),
);
const reads = new Map<string, number>();
let server: http.Server;
let base: string;

beforeAll(async () => {
  server = http.createServer((request, response) => {
    const url = new URL(request.url!, "http://localhost");
    reads.set(url.pathname, (reads.get(url.pathname) ?? 0) + 1);
    const redirect =
      /^\/entry\/(master|video|audio|captions|alias)\.m3u8$/.exec(url.pathname);
    if (redirect) {
      const target = ["master", "alias"].includes(redirect[1])
        ? "master.m3u8"
        : `${redirect[1]}/playlist.m3u8`;
      response.writeHead(redirect[1] === "video" ? 307 : 302, {
        Location: `/cdn/${target}?token=new`,
      });
      response.end();
      return;
    }
    if (url.pathname === "/one-shot.vtt") {
      response.writeHead(reads.get(url.pathname) === 1 ? 200 : 403);
      response.end(reads.get(url.pathname) === 1 ? captions : "Expired");
      return;
    }
    if (
      !url.pathname.startsWith("/cdn/") ||
      url.searchParams.get("token") !== "new"
    ) {
      response.writeHead(404);
      response.end();
      return;
    }
    let body: string | Buffer | undefined;
    if (url.pathname === "/cdn/master.m3u8")
      body = `#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",DEFAULT=YES,URI="audio/playlist.m3u8"\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,AUDIO="audio"\nvideo/playlist.m3u8\n`;
    const track = url.pathname.split("/")[2];
    if (url.pathname.endsWith("/playlist.m3u8"))
      body =
        track === "captions"
          ? "#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXTINF:4,\nsegment.vtt\n#EXT-X-ENDLIST\n"
          : '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:4,\nsegment.ts\n#EXT-X-ENDLIST\n';
    if (url.pathname.endsWith("/key.bin")) body = key;
    if (url.pathname.endsWith("/segment.ts")) body = encrypted[track];
    if (url.pathname.endsWith("/segment.vtt")) body = captions;
    response.writeHead(body ? 200 : 404);
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
beforeEach(() => reads.clear());
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

const level = (track: string) => ({
  type: "stream" as const,
  id: track,
  playlistID: `${base}/entry/master.m3u8?token=old`,
  uri: `${base}/entry/${track}.m3u8`,
});

describe("redirected HLS playlists and single-use caption URLs", () => {
  it("resolves master children at the final URL while retaining the captured playlist identity", async () => {
    const uri = `${base}/entry/master.m3u8?token=old`;
    const levels = await getLevelsFactory(FetchLoader, M3u8Parser)(uri, 1);
    expect(levels).toHaveLength(2);
    expect(levels.every((item) => item.playlistID === uri)).toBe(true);
    expect(levels.find((item) => item.type === "stream")?.uri).toBe(
      `${base}/cdn/video/playlist.m3u8`,
    );
    for (const item of levels) {
      const fragments = await getFragmentsDetailsFactory(
        FetchLoader,
        M3u8Parser,
      )(item, 1);
      expect(fragments[0].uri).toContain("token=new");
    }
  });
  it.each(["video", "audio"])(
    "downloads and decrypts the complete %s track after a media-playlist redirect",
    async (track) => {
      const fragments = await getFragmentsDetailsFactory(
        FetchLoader,
        M3u8Parser,
      )(level(track), 1);
      expect(fragments[0].uri).toBe(
        `${base}/cdn/${track}/segment.ts?token=new`,
      );
      expect(fragments[0].key.uri).toBe(
        `${base}/cdn/${track}/key.bin?token=new`,
      );
      const bytes = await downloadSingleFactory(FetchLoader)(fragments[0], 1);
      const clear = await decryptSingleFragmentFactory(
        FetchLoader,
        CryptoDecryptor,
      )(fragments[0].key, bytes, 1);
      expect(new Uint8Array(clear)).toEqual(new Uint8Array(source[track]));
    },
  );
  it("keeps encryption inspection aligned with the final playlist URL and token", async () => {
    const inspection = await inspectLevelEncryptionFactory(
      FetchLoader,
      M3u8Parser,
    )(level("video"), 1);
    expect(inspection.supported).toBe(true);
    expect(inspection.keyUris).toEqual([`${base}/cdn/video/key.bin?token=new`]);
  });
  it("resolves caption segments after a subtitle-playlist redirect", async () => {
    expect(
      await getSubtitleTextFactory(FetchLoader, M3u8Parser)(
        level("captions"),
        1,
      ),
    ).toBe(captions.trim());
  });
  it("reads a direct WebVTT URL once, even when a second request would expire", async () => {
    const uri = `${base}/one-shot.vtt`;
    expect(
      await getSubtitleTextFactory(FetchLoader, M3u8Parser)(
        { ...level("captions"), uri, playlistID: uri },
        1,
      ),
    ).toBe(captions.trim());
    expect(reads.get("/one-shot.vtt")).toBe(1);
  });
  it("does not collide audio tracks when two captured URLs redirect to the same master", async () => {
    const a = await getLevelsFactory(FetchLoader, M3u8Parser)(
      `${base}/entry/master.m3u8`,
      1,
    );
    const b = await getLevelsFactory(FetchLoader, M3u8Parser)(
      `${base}/entry/alias.m3u8`,
      1,
    );
    expect(a.find((item) => item.type === "audio")?.id).not.toBe(
      b.find((item) => item.type === "audio")?.id,
    );
  });
  it("retains ordinary non-redirecting master downloads", async () => {
    const levels = await getLevelsFactory(FetchLoader, M3u8Parser)(
      `${base}/cdn/master.m3u8?token=new`,
      1,
    );
    const fragments = await getFragmentsDetailsFactory(FetchLoader, M3u8Parser)(
      levels[0],
      1,
    );
    expect(fragments[0].uri).toBe(`${base}/cdn/video/segment.ts?token=new`);
  });
});
