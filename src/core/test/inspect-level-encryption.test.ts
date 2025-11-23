import { describe, it, expect, vi } from "vitest";
import { Level } from "../src/entities";
import { inspectLevelEncryptionFactory } from "../src/use-cases";
import type { ILoader, IParser } from "../src/services";

describe("inspectLevelEncryptionFactory", () => {
  const level = new Level(
    "stream",
    "level-1",
    "playlist-1",
    "http://example.com/level.m3u8"
  );

  it("marks AES-128 as supported", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("#EXTM3U"),
      fetchArrayBuffer: vi.fn(),
    };
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn(),
      inspectLevelEncryption: vi.fn().mockReturnValue({
        methods: ["AES-128"],
        keyUris: ["http://example.com/key"],
        iv: "0x1",
      }),
    };

    const run = inspectLevelEncryptionFactory(loader, parser);
    const result = await run(level, 2);

    expect(loader.fetchText).toHaveBeenCalledWith(
      "http://example.com/level.m3u8",
      2
    );
    expect(parser.inspectLevelEncryption).toHaveBeenCalled();
    expect(result).toMatchObject({
      levelId: "level-1",
      playlistId: "playlist-1",
      method: "AES-128",
      supported: true,
      keyUris: ["http://example.com/key"],
      iv: "0x1",
    });
    expect(result.message).toBeUndefined();
  });

  it("returns unsupported when method is not allowed", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("#EXTM3U"),
      fetchArrayBuffer: vi.fn(),
    };
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn(),
      inspectLevelEncryption: vi.fn().mockReturnValue({
        methods: ["SAMPLE-AES"],
        keyUris: [],
        iv: null,
      }),
    };

    const run = inspectLevelEncryptionFactory(loader, parser);
    const result = await run(level, 1);

    expect(result.supported).toBe(false);
    expect(result.method).toBe("SAMPLE-AES");
    expect(result.message).toContain("Unsupported encryption method");
  });
});
