import "fake-indexeddb/auto";
import { describe, expect, afterEach, test, vi } from "vitest";
import { openDB } from "idb";
import {
  IndexedDBFS,
  setSubtitleText,
  getSubtitleText,
} from "../src/services/indexedb-fs";

vi.mock("webextension-polyfill", () => {
  const storageMock = {
    local: {
      get: vi.fn(async () => ({})),
      set: vi.fn(async () => undefined),
    },
  };

  return {
    storage: storageMock,
    downloads: {},
    runtime: {},
    default: {
      storage: storageMock,
      downloads: {},
      runtime: {},
    },
  };
});

describe("subtitle storage in IDB", () => {
  afterEach(async () => {
    await IndexedDBFS.cleanup();
    vi.clearAllMocks();
  });

  test("stores subtitles in IndexedDB by job id", async () => {
    const jobId = "job-123";
    const subtitleRecord = {
      text: "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello",
      language: "en",
      name: "English",
    };
    const { storage } =
      (await vi.importMock("webextension-polyfill")) as unknown as {
        storage: {
          local: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };
        };
      };

    await setSubtitleText(jobId, subtitleRecord);

    const db = await openDB("subtitles", 1);
    const stored = await db.get("subtitles", jobId);
    db.close();

    expect(stored).toEqual({ id: jobId, ...subtitleRecord });

    const subtitle = await getSubtitleText(jobId);
    expect(subtitle).toEqual(subtitleRecord);
    expect(storage.local.get).not.toHaveBeenCalled();
    expect(storage.local.set).not.toHaveBeenCalled();
  });

  test("returns undefined for missing subtitle entry", async () => {
    const subtitle = await getSubtitleText("missing-id");
    expect(subtitle).toBeUndefined();
  });

  test("removes subtitles from IndexedDB during cleanup", async () => {
    const jobId = "cleanup-id";
    await setSubtitleText(jobId, { text: "some text", language: "fr" });
    expect(await getSubtitleText(jobId)).toBeDefined();

    await IndexedDBFS.cleanup();

    expect(await getSubtitleText(jobId)).toBeUndefined();
  });
});
