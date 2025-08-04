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
    const fragment = new Fragment(new Key(null, null), "https://frag", 1);
    const data = await run(fragment, 5);
    expect(loader.fetchArrayBuffer).toHaveBeenCalledWith("https://frag", 5);
    expect(data.byteLength).toBe(3);
  });

  it("gets fragments details", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockResolvedValue("playlist"),
      fetchArrayBuffer: vi.fn(),
    };
    const fragments = [new Fragment(new Key(null, null), "f1.ts", 0)];
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn().mockReturnValue(fragments),
    };
    const level = new Level(
      "stream",
      "l1",
      "p1",
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
    expect(result).toEqual(fragments);
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

  it("throws when master playlist fetch fails", async () => {
    const loader: ILoader = {
      fetchText: vi.fn().mockRejectedValue(new Error("fail")),
      fetchArrayBuffer: vi.fn(),
    };
    const parser: IParser = {
      parseMasterPlaylist: vi.fn(),
      parseLevelPlaylist: vi.fn(),
    };
    const run = getLevelsFactory(loader, parser);
    await expect(run("uri", 1)).rejects.toThrow("LevelManifest");
  });
});
