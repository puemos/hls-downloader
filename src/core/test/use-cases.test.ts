import { describe, it, expect, vi } from "vitest";
import {
  createBucketFactory,
  deleteBucketFactory,
  writeToBucketFactory,
  saveAsFactory,
  fsCleanupFactory,
  getLinkBucketFactory,
  generateFileName,
  decryptSingleFragmentFactory,
  downloadSingleFactory,
  getFragmentsDetailsFactory,
  getLevelsFactory,
  getStorageStatsFactory,
  getPlaylistDurationFactory,
} from "../src/use-cases/index.ts";
import { Playlist, Level, Key, Fragment } from "../src/entities/index.ts";
import type {
  IFS,
  Bucket,
  ILoader,
  IDecryptor,
  IParser,
} from "../src/services/index.ts";

const createFsMock = () => {
  const bucket: Bucket = {
    write: vi.fn().mockResolvedValue(undefined),
    getLink: vi.fn().mockResolvedValue("link"),
  };

  const fs: IFS = {
    cleanup: vi.fn().mockResolvedValue(undefined),
    createBucket: vi.fn().mockResolvedValue(undefined),
    deleteBucket: vi.fn().mockResolvedValue(undefined),
    getBucket: vi.fn().mockResolvedValue(bucket),
    saveAs: vi.fn().mockResolvedValue(undefined),
    getStorageStats: vi.fn().mockResolvedValue({
      buckets: [],
      estimate: { source: "fallback" },
    }),
  };
  return { fs, bucket };
};

describe("use-cases", () => {
  it("creates bucket", async () => {
    const { fs } = createFsMock();
    await createBucketFactory(fs)("id", 1, 2);
    expect(fs.createBucket).toHaveBeenCalledWith("id", 1, 2);
  });

  it("deletes bucket", async () => {
    const { fs } = createFsMock();
    await deleteBucketFactory(fs)("id");
    expect(fs.deleteBucket).toHaveBeenCalledWith("id");
  });

  it("writes to bucket", async () => {
    const { fs, bucket } = createFsMock();
    await writeToBucketFactory(fs)("id", 1, new ArrayBuffer(1));
    expect(fs.getBucket).toHaveBeenCalledWith("id");
    expect(bucket.write).toHaveBeenCalled();
  });

  it("saves to file", async () => {
    const { fs } = createFsMock();
    await saveAsFactory(fs)("p", "l", { dialog: true });
    expect(fs.saveAs).toHaveBeenCalledWith("p", "l", { dialog: true });
  });

  it("cleans up fs", async () => {
    const { fs } = createFsMock();
    await fsCleanupFactory(fs)();
    expect(fs.cleanup).toHaveBeenCalled();
  });

  it("gets link from bucket", async () => {
    const { fs, bucket } = createFsMock();
    const link = await getLinkBucketFactory(fs)("id");
    expect(fs.getBucket).toHaveBeenCalledWith("id");
    expect(bucket.getLink).toHaveBeenCalled();
    expect(link).toBe("link");
  });

  it("generates file name with page title", () => {
    const playlist = new Playlist(
      "1",
      "https://a/b/c.m3u8",
      Date.now(),
      "page"
    );
    const level = new Level("stream", "l", "1", "uri");
    const run = generateFileName();
    expect(run(playlist, level)).toBe("page-c.mp4");
  });

  it("normalizes non-ASCII page title", () => {
    const playlist = new Playlist(
      "1",
      "https://a/b/c.m3u8",
      Date.now(),
      "Cafe\u0301"
    );
    const level = new Level("stream", "l", "1", "uri");
    const run = generateFileName();
    expect(run(playlist, level)).toBe("Caf\u00E9-c.mp4");
  });

  it("decrypts fragment when key available", async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    };
    const decryptor: IDecryptor = {
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    };
    const run = decryptSingleFragmentFactory(loader, decryptor);
    const key = new Key("https://key", new Uint8Array([1]));
    const data = new ArrayBuffer(2);
    const result = await run(key, data, 2);
    expect(loader.fetchArrayBuffer).toHaveBeenCalledWith("https://key", 2);
    expect(decryptor.decrypt).toHaveBeenCalled();
    expect(result.byteLength).toBe(4);
  });

  it("returns original data if key missing", async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi.fn(),
    };
    const decryptor: IDecryptor = {
      decrypt: vi.fn(),
    };
    const run = decryptSingleFragmentFactory(loader, decryptor);
    const key = new Key(null, null);
    const data = new ArrayBuffer(2);
    const result = await run(key, data, 2);
    expect(result).toBe(data);
    expect(loader.fetchArrayBuffer).not.toHaveBeenCalled();
    expect(decryptor.decrypt).not.toHaveBeenCalled();
  });

  it("downloads single fragment", async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(3)),
    };
    const run = downloadSingleFactory(loader);
    const fragment = new Fragment(new Key(null, null), "https://frag", 1, null);
    const data = await run(fragment, 5);
    expect(loader.fetchArrayBuffer).toHaveBeenCalledWith("https://frag", 5);
    expect(data.byteLength).toBe(3);
  });

  it("falls back to fragment without params on fetch failure", async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce(new ArrayBuffer(1)),
    };
    const run = downloadSingleFactory(loader);
    const fragment = new Fragment(
      new Key(null, null),
      "https://example.com/frag.ts?token=abc",
      0,
      "https://example.com/frag.ts"
    );
    const data = await run(fragment, 2);

    expect(loader.fetchArrayBuffer).toHaveBeenNthCalledWith(
      1,
      "https://example.com/frag.ts?token=abc",
      2
    );
    expect(loader.fetchArrayBuffer).toHaveBeenNthCalledWith(
      2,
      "https://example.com/frag.ts",
      2
    );
    expect(data.byteLength).toBe(1);
  });

  it("gets fragments details", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("playlist"),
      fetchArrayBuffer: vi.fn(),
    };
    const fragments = [
      new Fragment(new Key(null, null), "http://example.com/f1.ts", 0),
    ];
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn().mockReturnValue(fragments),
      inspectLevelEncryption: vi.fn(),
    };
    const level = new Level(
      "stream",
      "l1",
      "http://example.com/master.m3u8",
      "http://example.com/level.m3u8"
    );
    const run = getFragmentsDetailsFactory(loader, parser);
    const result = await run(level, 7);
    expect(loader.fetchText).toHaveBeenCalledWith(
      "http://example.com/level.m3u8",
      7
    );
    expect(parser.parseLevelPlaylist).toHaveBeenCalledWith(
      "playlist",
      "http://example.com/level.m3u8"
    );
    expect(result).toHaveLength(1);
    expect(result[0]!.uri).toBe("http://example.com/f1.ts");
    expect(result[0]!.fallbackUri).toBeNull();
  });

  it("appends query params to fragments and keys and falls back on original", async () => {
    const loader: ILoader = {
      fetchText: vi
        .fn()
        .mockResolvedValueOnce("playlist")
        .mockResolvedValueOnce("playlist"),
      fetchArrayBuffer: vi.fn(),
    };
    const fragments = [
      new Fragment(
        new Key("http://example.com/key", new Uint8Array([1])),
        "http://example.com/video.ts",
        0
      ),
    ];
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn().mockReturnValue(fragments),
      inspectLevelEncryption: vi.fn(),
    };
    const level = new Level(
      "stream",
      "l1",
      "http://example.com/master.m3u8?session=abc",
      "http://example.com/level.m3u8"
    );
    const run = getFragmentsDetailsFactory(loader, parser);
    const result = await run(level, 3, {
      baseUri: level.playlistID,
    });

    expect(loader.fetchText).toHaveBeenCalledWith(
      "http://example.com/level.m3u8?session=abc",
      3
    );
    expect(result[0]!.uri).toBe("http://example.com/video.ts?session=abc");
    expect(result[0]!.fallbackUri).toBe("http://example.com/video.ts");
    expect(result[0]!.key.uri).toBe("http://example.com/key?session=abc");
    expect(result[0]!.key.fallbackUri).toBe("http://example.com/key");
  });

  it("gets levels", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("master"),
      fetchArrayBuffer: vi.fn(),
    };
    const levels = [
      new Level("stream", "l1", "p1", "http://example.com/level.m3u8"),
    ];
    const parser: IParser = {
      parseMasterPlaylist: vi.fn().mockReturnValue(levels),
      parseLevelPlaylist: vi.fn(),
      inspectLevelEncryption: vi.fn(),
    };
    const run = getLevelsFactory(loader, parser);
    const result = await run("http://example.com/master.m3u8", 9);
    expect(loader.fetchText).toHaveBeenCalledWith(
      "http://example.com/master.m3u8",
      9
    );
    expect(parser.parseMasterPlaylist).toHaveBeenCalledWith(
      "master",
      "http://example.com/master.m3u8"
    );
    expect(result).toEqual(levels);
  });

  it("appends query params from master playlist to level URIs when enabled", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("master"),
      fetchArrayBuffer: vi.fn(),
    };
    const levels = [
      new Level("stream", "l1", "p1", "http://example.com/level.m3u8"),
    ];
    const parser: IParser = {
      parseMasterPlaylist: vi.fn().mockReturnValue(levels),
      parseLevelPlaylist: vi.fn(),
      inspectLevelEncryption: vi.fn(),
    };
    const run = getLevelsFactory(loader, parser);
    const result = await run("http://example.com/master.m3u8?token=abc", 1);
    expect(result[0]!.uri).toBe("http://example.com/level.m3u8");
  });

  it("throws when master playlist fetch fails", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockRejectedValue(new Error("fail")),
      fetchArrayBuffer: vi.fn(),
    };
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn(),
      inspectLevelEncryption: vi.fn(),
    };
    const run = getLevelsFactory(loader, parser);
    await expect(run("uri", 1)).rejects.toThrow("LevelManifest");
  });

  it("calculates storage stats with expected size", async () => {
    const snapshot = {
      buckets: [
        {
          id: "job-1",
          videoLength: 2,
          audioLength: 1,
          storedBytes: 3_000,
          storedChunks: 1,
        },
      ],
      subtitlesBytes: 500,
      estimate: {
        usage: 4_000,
        quota: 10_000,
        available: 6_000,
        source: "navigator" as const,
      },
    };
    const { fs } = createFsMock();
    (fs.getStorageStats as any).mockResolvedValue(snapshot);
    const run = getStorageStatsFactory(fs as any);
    const stats = await run();

    expect(stats.buckets[0]?.expectedBytes).toBeCloseTo(9_000);
    expect(stats.totalUsedBytes).toBe(3_500);
    expect(stats.availableBytes).toBe(6_000);
    expect(stats.estimateSource).toBe("navigator");
  });

  it("calculates playlist duration from EXTINF", async () => {
    const loader: ILoader = {
      fetchText: vi
        .fn()
        .mockResolvedValue(
          "#EXTM3U\n#EXTINF:3.0,\na.ts\n#EXTINF:4.5,\nb.ts\n"
        ),
      fetchArrayBuffer: vi.fn(),
    };
    const run = getPlaylistDurationFactory(loader);
    const duration = await run("http://example.com/l.m3u8", null, 2);
    expect(loader.fetchText).toHaveBeenCalledWith(
      "http://example.com/l.m3u8",
      2
    );
    expect(duration).toBeCloseTo(7.5);
  });
});
