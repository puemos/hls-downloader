import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchText, fetchArrayBuffer } from "../src/services/fetch-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("FetchLoader", () => {
  describe("fetchText", () => {
    it("successfully fetches text on first attempt", async () => {
      const mockResponse = {
        text: () => Promise.resolve("success"),
        ok: true,
        status: 200,
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      const result = await fetchText("https://example.com");

      expect(result).toBe("success");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith("https://example.com");
    });

    it("retries failed fetches with exponential backoff", async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Server error"))
        .mockResolvedValueOnce({
          text: () => Promise.resolve("success"),
          ok: true,
          status: 200,
        });
      globalThis.fetch = fetchMock;

      const promise = fetchText("https://example.com", 3);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe("success");
      expect(fetchMock).toHaveBeenCalledTimes(3);

      const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
      expect(delays).toHaveLength(2);
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBeCloseTo(115, 1);
    });

    it("throws error when all retry attempts are exhausted", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn()
        .mockRejectedValue(new Error("Persistent failure"));
      globalThis.fetch = fetchMock;

      const promise = fetchText("https://example.com", 2);

      // Handle the promise rejection and timer advancement together
      const [, error] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise.catch((e) => e),
      ]);

      expect(error.status).toBe("fulfilled");
      if (error.status === "fulfilled") {
        expect(error.value).toBeInstanceOf(Error);
        expect(error.value.message).toBe("Persistent failure");
      }
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("throws error immediately when attempts parameter is less than 1", async () => {
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;

      await expect(fetchText("https://example.com", 0)).rejects.toThrow(
        "Attempts less then 1"
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("uses default attempt count of 1 when not specified", async () => {
      const mockResponse = {
        text: () => Promise.resolve("default"),
        ok: true,
        status: 200,
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      const result = await fetchText("https://example.com");

      expect(result).toBe("default");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("fails when response status is not ok", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 403, text: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(fetchText("https://example.com/forbidden")).rejects.toThrow(
        "HTTP 403"
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry HTTP errors", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404, text: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(fetchText("https://example.com/404", 3)).rejects.toThrow(
        "HTTP 404"
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("fetchArrayBuffer", () => {
    it("successfully fetches array buffer", async () => {
      const mockBuffer = new ArrayBuffer(8);
      const mockResponse = {
        arrayBuffer: () => Promise.resolve(mockBuffer),
        ok: true,
        status: 200,
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      const result = await fetchArrayBuffer("https://example.com/data.bin");

      expect(result).toBe(mockBuffer);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith("https://example.com/data.bin");
    });

    it("retries failed array buffer fetches", async () => {
      vi.useFakeTimers();
      const mockBuffer = new ArrayBuffer(8);
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          arrayBuffer: () => Promise.resolve(mockBuffer),
          ok: true,
          status: 200,
        });
      globalThis.fetch = fetchMock;

      const promise = fetchArrayBuffer("https://example.com/data.bin", 2);
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe(mockBuffer);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("throws when array buffer response is not ok", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500, arrayBuffer: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(
        fetchArrayBuffer("https://example.com/error.bin", 1)
      ).rejects.toThrow("HTTP 500");
    });

    it("throws last error when retries are exhausted", async () => {
      vi.useFakeTimers();
      const fetchMock = vi.fn().mockRejectedValue(new Error("Buffer failure"));
      globalThis.fetch = fetchMock;

      const promise = fetchArrayBuffer("https://example.com/error.bin", 2);

      const [, error] = await Promise.allSettled([
        vi.runAllTimersAsync(),
        promise.catch((e) => e),
      ]);

      expect(error.status).toBe("fulfilled");
      if (error.status === "fulfilled") {
        expect(error.value).toBeInstanceOf(Error);
        expect(error.value.message).toBe("Buffer failure");
      }
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("does not retry HTTP errors for array buffers", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 401, arrayBuffer: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(
        fetchArrayBuffer("https://example.com/protected.bin", 3)
      ).rejects.toThrow("HTTP 401");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
