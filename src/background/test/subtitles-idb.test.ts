import { describe, expect, beforeEach, test, vi } from "vitest";
import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import { setSubtitleText, getSubtitleText } from "../src/services/indexedb-fs";

vi.mock("webextension-polyfill", () => {
  const storageStore: Record<string, any> = {};
  const storageMock = {
    local: {
      get: vi.fn(async (key: string | string[]) => {
        if (Array.isArray(key)) {
          const res: Record<string, any> = {};
          key.forEach((k) => {
            res[k] = storageStore[k];
          });
          return res;
        }
        return { [key]: storageStore[key] };
      }),
      set: vi.fn(async (obj: Record<string, any>) => {
        Object.assign(storageStore, obj);
      }),
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
  beforeEach(() => {
    // Reset indexedDB for each test
    // @ts-expect-error fake-indexeddb provides IndexedDB implementation
    globalThis.indexedDB = new FDBFactory();
  });

  test("stores and retrieves subtitle text from IDB by job id", async () => {
    const jobId = "job-123";
    await setSubtitleText(jobId, {
      text: "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello",
      language: "en",
      name: "English",
    });

    const subtitle = await getSubtitleText(jobId);

    expect(subtitle).toBeDefined();
    expect(subtitle?.text).toContain("Hello");
    expect(subtitle?.language).toBe("en");
  });

  test("returns undefined for missing subtitle entry", async () => {
    const subtitle = await getSubtitleText("missing-id");
    expect(subtitle).toBeUndefined();
  });
});
