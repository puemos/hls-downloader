import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("webextension-polyfill", () => ({
  storage: {
    local: {
      set: vi.fn(),
      get: vi.fn(),
    },
  },
}));

import { saveState, getState } from "../src/persistState";
import { M3u8Parser } from "../src/services/m3u8-parser";

describe("persistState", () => {
  let mockSet: ReturnType<typeof vi.fn>;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const { storage } = (await vi.importMock("webextension-polyfill")) as any;
    mockSet = storage.local.set;
    mockGet = storage.local.get;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("saveState", () => {
    it("persists settings and track choices without encrypted runtime fragments", async () => {
      const fragments = M3u8Parser.parseLevelPlaylist(
        '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXTINF:2,\nsegment.ts\n',
        "https://example.com/playlist.m3u8",
      );
      const state = {
        config: { outputContainer: "mp4" },
        playlistPreferences: {
          audioSelections: { playlist: "english" },
          subtitleSelections: { playlist: "none" },
        },
        jobs: { jobs: { encrypted: { videoFragments: fragments } } },
      } as any;
      expect(fragments[0].key.iv).toBeInstanceOf(Uint8Array);

      await saveState(state);

      const saved = mockSet.mock.calls[0][0];
      expect(saved).toEqual({
        state: {
          config: state.config,
          playlistPreferences: state.playlistPreferences,
        },
      });
      mockGet.mockResolvedValue(saved);
      const restored = await getState();
      expect(restored?.config?.outputContainer).toBe("mp4");
      expect(restored?.playlistPreferences).toEqual(state.playlistPreferences);
      expect(restored).not.toHaveProperty("jobs");
      expect(state.jobs.jobs.encrypted.videoFragments).toBe(fragments);
    });

    it("writes state to storage", async () => {
      const state = { config: { foo: "bar" } } as any;
      await saveState(state);
      expect(mockSet).toHaveBeenCalledWith({ state });
    });

    it("does not write to storage when state is undefined", async () => {
      await saveState(undefined as any);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("does not write to storage when state is null", async () => {
      await saveState(null as any);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it("writes empty state object to storage", async () => {
      const state = { config: {} } as any;
      await saveState(state);
      expect(mockSet).toHaveBeenCalledWith({ state });
    });
  });

  describe("getState", () => {
    it("returns state with config when state exists", async () => {
      const mockState = {
        config: { foo: "bar" },
        otherProperty: { baz: "qux" },
      };
      mockGet.mockResolvedValue({ state: mockState });

      const result = await getState();

      expect(mockGet).toHaveBeenCalledWith(["state"]);
      expect(result?.config?.foo).toBe("bar");
      expect(result?.config?.maxActiveDownloads).toBeDefined();
    });

    it("returns undefined when no state exists", async () => {
      mockGet.mockResolvedValue({});
      const state = await getState();
      expect(mockGet).toHaveBeenCalledWith(["state"]);
      expect(state).toBeUndefined();
    });

    it("returns undefined when state is null", async () => {
      mockGet.mockResolvedValue({ state: null });
      const state = await getState();
      expect(mockGet).toHaveBeenCalledWith(["state"]);
      expect(state).toBeUndefined();
    });

    it("returns undefined when state is undefined", async () => {
      mockGet.mockResolvedValue({ state: undefined });
      const state = await getState();
      expect(mockGet).toHaveBeenCalledWith(["state"]);
      expect(state).toBeUndefined();
    });

    it("returns only config property from state", async () => {
      const mockState = {
        config: { setting1: "value1" },
        downloads: { activeDownloads: [] },
        ui: { theme: "dark" },
      };
      mockGet.mockResolvedValue({ state: mockState });

      const result = await getState();

      expect(result?.config?.setting1).toBe("value1");
      expect(result?.config?.maxActiveDownloads).toBeDefined();
      expect(result).not.toHaveProperty("downloads");
      expect(result).not.toHaveProperty("ui");
    });

    it("defaults output container to mp4 for older persisted config", async () => {
      mockGet.mockResolvedValue({ state: { config: {} } });

      const result = await getState();

      expect(result?.config?.outputContainer).toBe("mp4");
    });

    it("preserves persisted mkv output container", async () => {
      mockGet.mockResolvedValue({
        state: { config: { outputContainer: "mkv" } },
      });

      const result = await getState();

      expect(result?.config?.outputContainer).toBe("mkv");
    });
  });
});
