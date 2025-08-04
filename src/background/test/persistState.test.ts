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
      expect(result).toEqual({ config: { foo: "bar" } });
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

      expect(result).toEqual({ config: { setting1: "value1" } });
      expect(result).not.toHaveProperty("downloads");
      expect(result).not.toHaveProperty("ui");
    });
  });
});
