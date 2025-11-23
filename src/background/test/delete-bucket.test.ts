import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.mock("webextension-polyfill", () => {
  const storage = {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  };
  const downloads = {
    download: vi.fn(),
  };
  return {
    __esModule: true,
    default: { storage, downloads },
    storage,
    downloads,
  };
});
import "fake-indexeddb/auto";
import { IndexedDBFS } from "../src/services/indexedb-fs";

describe("IndexedDBFS deleteBucket", () => {
  beforeEach(async () => {
    await IndexedDBFS.cleanup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("removes bucket data from indexedDB", async () => {
    const bucketId = "job-delete-test";
    await IndexedDBFS.createBucket(bucketId, 1, 0);
    const bucket = await IndexedDBFS.getBucket(bucketId);
    await bucket?.write(0, new ArrayBuffer(1));

    const dbsBefore = await (indexedDB as any).databases();
    expect(dbsBefore.some((db: any) => db.name === bucketId)).toBe(true);

    await IndexedDBFS.deleteBucket(bucketId);

    const dbsAfter = await (indexedDB as any).databases();
    expect(dbsAfter.some((db: any) => db.name === bucketId)).toBe(false);
  });
});
