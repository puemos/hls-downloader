import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { createCipheriv } from "node:crypto";
import { getSubtitleTextFactory } from "@hls-downloader/core/lib/use-cases/get-subtitle-text";
import { downloadSubtitleTrackFactory } from "@hls-downloader/core/lib/use-cases/download-subtitle-track";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { FetchLoader } from "../src/services/fetch-loader";
import { CryptoDecryptor } from "../src/services/crypto-decryptor";

const key = Buffer.alloc(16, 0x35);
const secondKey = Buffer.alloc(16, 0x72);
const parts = [
  "WEBVTT\n\n00:00:00.000 --> 00:00:04.000\nFirst caption\n",
  "WEBVTT\n\n00:00:04.000 --> 00:00:08.000\nLast caption\n",
];
const expected = parts.map((text) => text.trim()).join("\n\n");
const assets = new Map<string, Buffer>();
const requests: string[] = [];
let server: http.Server;
let base: string;

function encrypt(text: string, keyBytes: Buffer, sequence: number) {
  const iv = Buffer.alloc(16);
  iv.writeBigUInt64BE(BigInt(sequence), 8);
  const cipher = createCipheriv("aes-128-cbc", keyBytes, iv);
  return Buffer.concat([cipher.update(text), cipher.final()]);
}

beforeAll(async () => {
  for (const kind of [
    "implicit",
    "explicit",
    "rotation",
    "clear-lead",
    "plain",
  ]) {
    const explicit = kind === "explicit";
    const firstEncrypted = !["clear-lead", "plain"].includes(kind);
    const firstTag = firstEncrypted
      ? `#EXT-X-KEY:METHOD=AES-128,URI="key.bin"${explicit ? ",IV=0x00000000000000000000000000000063" : ""}\n`
      : "";
    const nextTag =
      kind === "rotation"
        ? '#EXT-X-KEY:METHOD=AES-128,URI="second-key.bin"\n'
        : kind === "clear-lead"
          ? '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n'
          : "";
    assets.set(
      `/${kind}/playlist.m3u8`,
      Buffer.from(
        `#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-MEDIA-SEQUENCE:42\n${firstTag}#EXTINF:4,\n0.vtt\n${nextTag}#EXTINF:4,\n1.vtt\n#EXT-X-ENDLIST\n`,
      ),
    );
    assets.set(`/${kind}/key.bin`, key);
    assets.set(`/${kind}/second-key.bin`, secondKey);
    assets.set(
      `/${kind}/0.vtt`,
      firstEncrypted
        ? encrypt(parts[0], key, explicit ? 99 : 42)
        : Buffer.from(parts[0]),
    );
    assets.set(
      `/${kind}/1.vtt`,
      kind === "plain"
        ? Buffer.from(parts[1])
        : encrypt(
            parts[1],
            kind === "rotation" ? secondKey : key,
            explicit ? 99 : 43,
          ),
    );
  }
  assets.set(
    "/invalid-key/playlist.m3u8",
    assets.get("/implicit/playlist.m3u8")!,
  );
  assets.set("/invalid-key/0.vtt", assets.get("/implicit/0.vtt")!);
  assets.set("/invalid-key/key.bin", Buffer.alloc(15));
  assets.set(
    "/unsupported/playlist.m3u8",
    Buffer.from(
      '#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-KEY:METHOD=SAMPLE-AES,URI="key.bin",IV=0x00000000000000000000000000000001\n#EXTINF:4,\n0.vtt\n#EXT-X-ENDLIST\n',
    ),
  );
  for (const kind of ["range", "plain-range"]) {
    const bytes = parts.map((text, index) =>
      kind === "range" ? encrypt(text, key, 42 + index) : Buffer.from(text),
    );
    const tag =
      kind === "range" ? '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n' : "";
    assets.set(`/${kind}/key.bin`, key);
    assets.set(`/${kind}/captions.bin`, Buffer.concat(bytes));
    assets.set(
      `/${kind}/playlist.m3u8`,
      Buffer.from(
        `#EXTM3U\n#EXT-X-TARGETDURATION:4\n#EXT-X-MEDIA-SEQUENCE:42\n${tag}#EXTINF:4,\n#EXT-X-BYTERANGE:${bytes[0].length}@0\ncaptions.bin\n#EXTINF:4,\n#EXT-X-BYTERANGE:${bytes[1].length}@${bytes[0].length}\ncaptions.bin\n#EXT-X-ENDLIST\n`,
      ),
    );
  }
  assets.set(
    "/parent/master.m3u8",
    Buffer.from("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nvideo.m3u8\n"),
  );
  server = http.createServer((request, response) => {
    const url = new URL(request.url!, "http://localhost");
    requests.push(url.pathname + url.search);
    if (url.pathname === "/direct.vtt") {
      response.writeHead(403);
      response.end("Expired caption URL");
      return;
    }
    let body = assets.get(url.pathname);
    let status = body ? 200 : 404;
    if (body && request.headers.range) {
      const match = /^bytes=(\d+)-(\d+)$/.exec(request.headers.range)!;
      response.setHeader(
        "Content-Range",
        `bytes ${match[1]}-${match[2]}/${body.length}`,
      );
      body = body.subarray(Number(match[1]), Number(match[2]) + 1);
      status = 206;
    }
    response.writeHead(status);
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("encrypted WebVTT subtitles", () => {
  it.each(["range", "plain-range"])(
    "respects byte ranges for %s captions without duplicating cues",
    async (kind) => {
      const uri = `${base}/${kind}/playlist.m3u8`;
      expect(
        await getSubtitleTextFactory(
          FetchLoader,
          M3u8Parser,
          kind === "range" ? CryptoDecryptor : undefined,
        )({ type: "subtitle", id: kind, playlistID: uri, uri }, 1),
      ).toBe(expected);
    },
  );

  it("does not substitute a parent master playlist for an unavailable subtitle file", async () => {
    const uri = `${base}/direct.vtt`;
    await expect(
      getSubtitleTextFactory(FetchLoader, M3u8Parser)(
        {
          type: "subtitle",
          id: "direct",
          playlistID: `${base}/parent/master.m3u8`,
          uri,
        },
        1,
        { baseUri: `${base}/parent/master.m3u8` },
      ),
    ).rejects.toThrow("HTTP 403");
    expect(requests).not.toContain("/parent/master.m3u8");
  });

  it.each(["implicit", "explicit", "rotation", "clear-lead", "plain"])(
    "reads %s caption segments as clear WebVTT",
    async (kind) => {
      const uri = `${base}/${kind}/playlist.m3u8?token=example`;
      const level = {
        type: "subtitle",
        id: kind,
        playlistID: uri,
        uri,
        language: "en",
      } as const;
      const text = await getSubtitleTextFactory(
        FetchLoader,
        M3u8Parser,
        CryptoDecryptor,
      )(level, 2);
      expect(text).toBe(expected);
      if (kind !== "plain")
        expect(
          requests.some((url) => url === `/${kind}/key.bin?token=example`),
        ).toBe(true);
    },
  );

  it("uses the same decrypted text for a standalone subtitle save", async () => {
    const uri = `${base}/implicit/playlist.m3u8`;
    let saved = "";
    const fs = {
      prepareTextDownload: async (text: string) => {
        saved = text;
        return {
          url: "blob:test",
          exportId: "text",
          mime: "text/vtt",
          size: text.length,
        };
      },
      saveAs: async () => 1,
    };
    await downloadSubtitleTrackFactory(
      FetchLoader,
      M3u8Parser,
      fs as any,
      CryptoDecryptor,
    )(
      { type: "subtitle", id: "en", playlistID: uri, uri, language: "en" },
      { id: uri, uri, createdAt: 1, pageTitle: "Captions" },
      1,
      false,
    );
    expect(saved).toBe(expected);
  });

  it("fails instead of saving garbled captions when a key is invalid", async () => {
    const uri = `${base}/implicit/playlist.m3u8`;
    await expect(
      getSubtitleTextFactory(FetchLoader, M3u8Parser, {
        decrypt: async () => {
          throw new Error("Invalid caption key");
        },
      })({ type: "subtitle", id: "bad", playlistID: uri, uri }, 1),
    ).rejects.toThrow("Invalid caption key");
  });

  it("rejects a genuinely invalid AES key before producing subtitle text", async () => {
    const uri = `${base}/invalid-key/playlist.m3u8`;
    await expect(
      getSubtitleTextFactory(
        FetchLoader,
        M3u8Parser,
        CryptoDecryptor,
      )({ type: "subtitle", id: "invalid", playlistID: uri, uri }, 1),
    ).rejects.toThrow();
  });

  it("rejects unsupported subtitle encryption instead of treating it as AES-CBC", async () => {
    const uri = `${base}/unsupported/playlist.m3u8`;
    await expect(
      getSubtitleTextFactory(
        FetchLoader,
        M3u8Parser,
        CryptoDecryptor,
      )({ type: "subtitle", id: "sample-aes", playlistID: uri, uri }, 1),
    ).rejects.toThrow("Unsupported subtitle encryption method: SAMPLE-AES");
  });
});
