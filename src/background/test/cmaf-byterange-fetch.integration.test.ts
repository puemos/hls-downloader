import { describe, it, expect, beforeAll, afterAll } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { createHlsServer, HlsServer } from "./helpers/hls-server";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { fetchText, fetchArrayBuffer } from "../src/services/fetch-loader";

const FIXTURES_DIR = path.join(__dirname, "fixtures");
const CMAF_STREAM_PATH = path.join(FIXTURES_DIR, "cmaf-stream.mp4");

/**
 * Build a synthetic fMP4 file (~1KB) with recognizable byte patterns.
 * Layout matches cmaf-level.m3u8:
 *   Init:  100 bytes @ 0   (ftyp header + 0x01 fill)
 *   Seg 1: 200 bytes @ 100 (0xAA fill)
 *   Seg 2: 200 bytes @ 300 (0xBB fill)
 */
function buildCmafStream(): Uint8Array {
  const size = 1024;
  const data = new Uint8Array(size);

  // ftyp box header at offset 0
  const boxSize = 24;
  data[0] = (boxSize >> 24) & 0xff;
  data[1] = (boxSize >> 16) & 0xff;
  data[2] = (boxSize >> 8) & 0xff;
  data[3] = boxSize & 0xff;
  data[4] = 0x66; // 'f'
  data[5] = 0x74; // 't'
  data[6] = 0x79; // 'y'
  data[7] = 0x70; // 'p'

  // Fill init region (bytes 8-99) with 0x01
  data.fill(0x01, 8, 100);

  // Fill segment 1 region (bytes 100-299) with 0xAA
  data.fill(0xaa, 100, 300);

  // Fill segment 2 region (bytes 300-499) with 0xBB
  data.fill(0xbb, 300, 500);

  return data;
}

describe("CMAF Byte-Range Fetch Integration", () => {
  let server: HlsServer;
  let cmafData: Uint8Array;

  beforeAll(async () => {
    cmafData = buildCmafStream();
    fs.writeFileSync(CMAF_STREAM_PATH, cmafData);
    server = await createHlsServer(FIXTURES_DIR);
  });

  afterAll(async () => {
    await server.close();
    try {
      fs.unlinkSync(CMAF_STREAM_PATH);
    } catch {
      // best effort
    }
  });

  it("parses CMAF playlist with correct byteRange fields", async () => {
    const levelUrl = `${server.baseUrl}/cmaf-level.m3u8`;
    const levelText = await fetchText(levelUrl);
    const fragments = M3u8Parser.parseLevelPlaylist(levelText, levelUrl);

    // Init fragment + 2 media segments
    expect(fragments).toHaveLength(3);

    // Init fragment
    expect(fragments[0].byteRange).toEqual({ offset: 0, length: 100 });
    expect(fragments[0].uri).toContain("cmaf-stream.mp4");

    // Media segments
    expect(fragments[1].byteRange).toEqual({ offset: 100, length: 200 });
    expect(fragments[2].byteRange).toEqual({ offset: 300, length: 200 });
  });

  it("fetches init segment with byterange → returns correct byte slice", async () => {
    const url = `${server.baseUrl}/cmaf-stream.mp4`;
    const buffer = await fetchArrayBuffer(url, 1, { offset: 0, length: 100 });
    const data = new Uint8Array(buffer);

    expect(data.byteLength).toBe(100);

    // Should start with ftyp box header
    expect(data[4]).toBe(0x66); // 'f'
    expect(data[5]).toBe(0x74); // 't'
    expect(data[6]).toBe(0x79); // 'y'
    expect(data[7]).toBe(0x70); // 'p'

    // Bytes 8-99 should be 0x01 (init fill)
    for (let i = 8; i < 100; i++) {
      expect(data[i]).toBe(0x01);
    }
  });

  it("fetches segment 1 with byterange → returns only its byte slice", async () => {
    const url = `${server.baseUrl}/cmaf-stream.mp4`;
    const buffer = await fetchArrayBuffer(url, 1, { offset: 100, length: 200 });
    const data = new Uint8Array(buffer);

    expect(data.byteLength).toBe(200);

    // Entire slice should be 0xAA
    for (let i = 0; i < data.byteLength; i++) {
      expect(data[i]).toBe(0xaa);
    }
  });

  it("fetches segment 2 with byterange → returns only its byte slice", async () => {
    const url = `${server.baseUrl}/cmaf-stream.mp4`;
    const buffer = await fetchArrayBuffer(url, 1, { offset: 300, length: 200 });
    const data = new Uint8Array(buffer);

    expect(data.byteLength).toBe(200);

    // Entire slice should be 0xBB
    for (let i = 0; i < data.byteLength; i++) {
      expect(data[i]).toBe(0xbb);
    }
  });

  it("each byte-range fetch returns distinct data", async () => {
    const url = `${server.baseUrl}/cmaf-stream.mp4`;

    const initBuf = await fetchArrayBuffer(url, 1, { offset: 0, length: 100 });
    const seg1Buf = await fetchArrayBuffer(url, 1, {
      offset: 100,
      length: 200,
    });
    const seg2Buf = await fetchArrayBuffer(url, 1, {
      offset: 300,
      length: 200,
    });

    const init = new Uint8Array(initBuf);
    const seg1 = new Uint8Array(seg1Buf);
    const seg2 = new Uint8Array(seg2Buf);

    // All three slices should have different fill values
    expect(init[10]).toBe(0x01);
    expect(seg1[0]).toBe(0xaa);
    expect(seg2[0]).toBe(0xbb);
  });

  it("fetch without byteRange returns full file", async () => {
    const url = `${server.baseUrl}/cmaf-stream.mp4`;
    const buffer = await fetchArrayBuffer(url);
    const data = new Uint8Array(buffer);

    expect(data.byteLength).toBe(1024);
    // Should start with ftyp header
    expect(data[4]).toBe(0x66);
  });

  it("full loop: master → CMAF level → fetch all byte-range segments", async () => {
    const masterUrl = `${server.baseUrl}/cmaf-master.m3u8`;

    // Parse master
    const masterText = await fetchText(masterUrl);
    const levels = M3u8Parser.parseMasterPlaylist(masterText, masterUrl);
    const cmafLevel = levels.find((l) => l.uri.includes("cmaf-level.m3u8"));
    expect(cmafLevel).toBeDefined();

    // Parse level
    const levelText = await fetchText(cmafLevel!.uri);
    const fragments = M3u8Parser.parseLevelPlaylist(levelText, cmafLevel!.uri);
    expect(fragments).toHaveLength(3);

    // Fetch all fragments with byte ranges
    const buffers: ArrayBuffer[] = [];
    for (const frag of fragments) {
      const buf = frag.byteRange
        ? await fetchArrayBuffer(frag.uri, 1, frag.byteRange)
        : await fetchArrayBuffer(frag.uri);
      buffers.push(buf);
    }

    // Init: 100 bytes, starts with ftyp
    expect(buffers[0].byteLength).toBe(100);
    expect(new Uint8Array(buffers[0])[4]).toBe(0x66);

    // Segment 1: 200 bytes, all 0xAA
    expect(buffers[1].byteLength).toBe(200);
    expect(new Uint8Array(buffers[1])[0]).toBe(0xaa);

    // Segment 2: 200 bytes, all 0xBB
    expect(buffers[2].byteLength).toBe(200);
    expect(new Uint8Array(buffers[2])[0]).toBe(0xbb);
  });
});
