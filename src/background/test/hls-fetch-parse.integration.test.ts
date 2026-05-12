import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import { createHlsServer, HlsServer } from "./helpers/hls-server";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { fetchText, fetchArrayBuffer } from "../src/services/fetch-loader";

const TS_SYNC_BYTE = 0x47;
const FIXTURES_DIR = path.join(__dirname, "fixtures");

describe("HLS Fetch + Parse Integration", () => {
  let server: HlsServer;

  beforeAll(async () => {
    server = await createHlsServer(FIXTURES_DIR);
  });

  afterAll(async () => {
    await server.close();
  });

  it("fetches and parses master playlist into levels with correct URIs", async () => {
    const masterUrl = `${server.baseUrl}/master.m3u8`;
    const masterText = await fetchText(masterUrl);

    expect(masterText).toContain("#EXTM3U");
    expect(masterText).toContain("#EXT-X-STREAM-INF");

    const levels = M3u8Parser.parseMasterPlaylist(masterText, masterUrl);

    expect(levels.length).toBeGreaterThanOrEqual(2);

    // Each level should have an absolute URI pointing to a level playlist
    const muxedLevel = levels.find((l) => l.uri.includes("level-muxed.m3u8"));
    const videoLevel = levels.find((l) =>
      l.uri.includes("level-video-only.m3u8")
    );

    expect(muxedLevel).toBeDefined();
    expect(videoLevel).toBeDefined();

    // URIs should be absolute, pointing to our server
    expect(muxedLevel!.uri).toMatch(/^http:\/\/127\.0\.0\.1:\d+/);
    expect(videoLevel!.uri).toMatch(/^http:\/\/127\.0\.0\.1:\d+/);

    // Should have bandwidth info from the master playlist
    expect(muxedLevel!.bitrate).toBe(836280);
    expect(videoLevel!.bitrate).toBe(246440);
  });

  it("fetches and parses level playlist into fragments with correct indices", async () => {
    const levelUrl = `${server.baseUrl}/level-muxed.m3u8`;
    const levelText = await fetchText(levelUrl);

    expect(levelText).toContain("#EXT-X-ENDLIST");

    const fragments = M3u8Parser.parseLevelPlaylist(levelText, levelUrl);

    expect(fragments).toHaveLength(2);

    // Fragments should have sequential indices
    expect(fragments[0].index).toBe(0);
    expect(fragments[1].index).toBe(1);

    // Fragment URIs should be absolute and point to .ts files
    expect(fragments[0].uri).toContain("video-audio-muxed.ts");
    expect(fragments[1].uri).toContain("video-audio-seg2.ts");
    expect(fragments[0].uri).toMatch(/^http:\/\/127\.0\.0\.1:\d+/);
  });

  it("fetches real TS segment with valid MPEG-TS data", async () => {
    const segmentUrl = `${server.baseUrl}/video-audio-muxed.ts`;
    const buffer = await fetchArrayBuffer(segmentUrl);

    expect(buffer.byteLength).toBeGreaterThan(0);

    const data = new Uint8Array(buffer);

    // Must start with TS sync byte
    expect(data[0]).toBe(TS_SYNC_BYTE);

    // MPEG-TS packets are 188 bytes; file should be a multiple of 188
    expect(data.byteLength % 188).toBe(0);

    // Every 188 bytes should also be a sync byte
    for (let i = 0; i < data.byteLength; i += 188) {
      expect(data[i]).toBe(TS_SYNC_BYTE);
    }
  });

  it("full loop: master → level → fetch all segments", async () => {
    const masterUrl = `${server.baseUrl}/master.m3u8`;

    // Step 1: Parse master
    const masterText = await fetchText(masterUrl);
    const levels = M3u8Parser.parseMasterPlaylist(masterText, masterUrl);
    expect(levels.length).toBeGreaterThan(0);

    // Step 2: Pick the muxed level and parse it
    const muxedLevel = levels.find((l) => l.uri.includes("level-muxed.m3u8"));
    expect(muxedLevel).toBeDefined();

    const levelText = await fetchText(muxedLevel!.uri);
    const fragments = M3u8Parser.parseLevelPlaylist(levelText, muxedLevel!.uri);
    expect(fragments).toHaveLength(2);

    // Step 3: Fetch all fragments and verify they're valid TS data
    const segmentBuffers: ArrayBuffer[] = [];
    for (const frag of fragments) {
      const buf = await fetchArrayBuffer(frag.uri);
      segmentBuffers.push(buf);
    }

    expect(segmentBuffers).toHaveLength(2);

    // Both segments should be valid MPEG-TS
    for (const buf of segmentBuffers) {
      const data = new Uint8Array(buf);
      expect(data[0]).toBe(TS_SYNC_BYTE);
      expect(data.byteLength).toBeGreaterThan(100); // non-trivial size
      expect(data.byteLength % 188).toBe(0);
    }

    // Segments should have different content (different scenes from Big Buck Bunny)
    const seg1 = new Uint8Array(segmentBuffers[0]);
    const seg2 = new Uint8Array(segmentBuffers[1]);
    let differs = false;
    for (let i = 0; i < seg1.byteLength; i++) {
      if (seg1[i] !== seg2[i]) {
        differs = true;
        break;
      }
    }
    expect(differs).toBe(true);
  });
});
