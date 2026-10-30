import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchText, fetchArrayBuffer } from "../src/services/fetch-loader";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("FetchLoader", () => {
  describe("network recovery (#267)", () => {
    it("keeps permanent HTTP errors terminal even if their response body fails", async () => {
      vi.useFakeTimers();
      const response = new Response(
        new ReadableStream({
          start(body) {
            body.error(new Error("connection lost after HTTP headers"));
          },
        }),
        { status: 401 },
      );
      const fetchMock = vi.fn().mockResolvedValue(response);
      globalThis.fetch = fetchMock;
      const result = fetchArrayBuffer(
        "https://example.com/protected.ts",
        2,
      ).catch((error) => error);
      await vi.runAllTimersAsync();
      expect((await result).message).toBe("HTTP 401");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not start requests when the job was already cancelled", async () => {
      const controller = new AbortController();
      controller.abort();
      const fetchMock = vi.fn();
      globalThis.fetch = fetchMock;
      await expect(
        fetchArrayBuffer(
          "https://example.com/segment.ts",
          100,
          undefined,
          controller.signal,
        ),
      ).rejects.toMatchObject({ name: "AbortError" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("cancels retry backoff immediately without another request", async () => {
      vi.useFakeTimers();
      const controller = new AbortController();
      const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
      globalThis.fetch = fetchMock;
      const result = fetchText(
        "https://example.com/playlist.m3u8",
        100,
        controller.signal,
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(1);
      controller.abort();
      expect((await result).name).toBe("AbortError");
      await vi.runAllTimersAsync();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("aborts an in-flight body without retrying a cancelled job", async () => {
      vi.useFakeTimers();
      const controller = new AbortController();
      let requestSignal: AbortSignal;
      const fetchMock = vi.fn().mockImplementation((_url, init) => {
        requestSignal = init.signal;
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(body) {
                body.enqueue(new Uint8Array([1]));
                requestSignal.addEventListener("abort", () =>
                  body.error(requestSignal.reason),
                );
              },
            }),
          ),
        );
      });
      globalThis.fetch = fetchMock;
      const result = fetchArrayBuffer(
        "https://example.com/segment.ts",
        100,
        undefined,
        controller.signal,
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(1);
      controller.abort();
      expect((await result).name).toBe("AbortError");
      expect(requestSignal!.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });

    it("honors HTTP-date Retry-After values", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-29T12:00:00Z"));
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("busy", {
            status: 503,
            headers: { "Retry-After": "Thu, 29 Oct 2026 12:00:03 GMT" },
          }),
        )
        .mockResolvedValueOnce(new Response("recovered"));
      globalThis.fetch = fetchMock;
      const result = fetchText("https://example.com/playlist.m3u8", 2);
      await vi.advanceTimersByTimeAsync(2999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(await result).toBe("recovered");
    });

    it("reports long Retry-After values without retrying sooner than permitted", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response("busy", {
          status: 429,
          headers: { "Retry-After": "120" },
        }),
      );
      globalThis.fetch = fetchMock;
      await expect(
        fetchText("https://example.com/playlist.m3u8", 100),
      ).rejects.toThrow("HTTP 429");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([408, 429, 500, 502, 503, 504])(
      "retries transient HTTP %i responses without dropping media bytes",
      async (status) => {
        vi.useFakeTimers();
        const bytes = new Uint8Array([0x47, 1, 2, 3]);
        const fetchMock = vi
          .fn()
          .mockResolvedValueOnce(
            new Response("temporarily unavailable", { status }),
          )
          .mockResolvedValueOnce(new Response(bytes));
        globalThis.fetch = fetchMock;
        const result = fetchArrayBuffer(
          "https://example.com/segment.ts",
          2,
        ).catch((error) => error);
        await vi.runAllTimersAsync();
        expect(new Uint8Array(await result)).toEqual(bytes);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      },
    );

    it("respects Retry-After before fetching the same resource again", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("busy", {
            status: 429,
            headers: { "Retry-After": "2" },
          }),
        )
        .mockResolvedValueOnce(new Response("recovered"));
      globalThis.fetch = fetchMock;
      const result = fetchText("https://example.com/playlist.m3u8", 2).catch(
        (error) => error,
      );
      await vi.advanceTimersByTimeAsync(1999);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(await result).toBe("recovered");
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it("caps backoff so an interruption cannot cause hours between retries", async () => {
      vi.useFakeTimers();
      const timers = vi.spyOn(globalThis, "setTimeout");
      const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
      globalThis.fetch = fetchMock;
      const result = fetchText("https://example.com/playlist.m3u8", 45).catch(
        (error) => error,
      );
      await vi.runAllTimersAsync();
      expect((await result).message).toBe("offline");
      expect(fetchMock).toHaveBeenCalledTimes(45);
      // The request's inactivity watchdog is separate from retry backoff.
      const delays = timers.mock.calls
        .map((call) => Number(call[1]))
        .filter((ms) => ms !== 30_000);
      expect(delays).toHaveLength(44);
      expect(Math.max(...delays)).toBeLessThanOrEqual(2_000);
    });

    it("aborts a stalled request and retries when connectivity returns", async () => {
      vi.useFakeTimers();
      let signal: AbortSignal | undefined;
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(
          (_url, init) =>
            new Promise((_resolve, reject) => {
              signal = init?.signal;
              signal?.addEventListener("abort", () => reject(signal?.reason));
            }),
        )
        .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])));
      globalThis.fetch = fetchMock;
      const result = fetchArrayBuffer(
        "https://example.com/segment.ts",
        2,
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(30_100);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(signal?.aborted).toBe(true);
      expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("retries a body that stalls after its headers and first bytes arrive", async () => {
      vi.useFakeTimers();
      const fetchMock = vi
        .fn()
        .mockImplementationOnce((_url, init) =>
          Promise.resolve(
            new Response(
              new ReadableStream({
                start(controller) {
                  controller.enqueue(new Uint8Array([9]));
                  init?.signal?.addEventListener("abort", () =>
                    controller.error(init.signal.reason),
                  );
                },
              }),
            ),
          ),
        )
        .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])));
      globalThis.fetch = fetchMock;
      const result = fetchArrayBuffer(
        "https://example.com/segment.ts",
        2,
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(30_100);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it("allows a slow transfer to exceed 30 seconds while bytes keep arriving", async () => {
      vi.useFakeTimers();
      let signal: AbortSignal | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        signal = init?.signal;
        return Promise.resolve(
          new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new Uint8Array([1]));
                setTimeout(
                  () => controller.enqueue(new Uint8Array([2])),
                  29_000,
                );
                setTimeout(() => {
                  controller.enqueue(new Uint8Array([3]));
                  controller.close();
                }, 58_000);
                signal?.addEventListener("abort", () =>
                  controller.error(signal?.reason),
                );
              },
            }),
          ),
        );
      });
      const result = fetchArrayBuffer("https://example.com/slow.ts", 1).catch(
        (error) => error,
      );
      await vi.advanceTimersByTimeAsync(58_000);
      expect(new Uint8Array(await result)).toEqual(new Uint8Array([1, 2, 3]));
      expect(signal?.aborted ?? false).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

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
      expect(fetchMock).toHaveBeenCalledWith("https://example.com", {
        signal: expect.any(AbortSignal),
      });
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

      const delays = setTimeoutSpy.mock.calls
        .map((call) => call[1])
        .filter((ms) => ms !== 30_000);
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
        "Attempts less then 1",
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
        "HTTP 403",
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("does not retry HTTP errors", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404, text: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(fetchText("https://example.com/404", 3)).rejects.toThrow(
        "HTTP 404",
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
      expect(fetchMock).toHaveBeenCalledWith("https://example.com/data.bin", {
        signal: expect.any(AbortSignal),
      });
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
        fetchArrayBuffer("https://example.com/error.bin", 1),
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

    it("sends Range header when byteRange is provided", async () => {
      const mockBuffer = new ArrayBuffer(50000);
      const mockResponse = {
        arrayBuffer: () => Promise.resolve(mockBuffer),
        ok: true,
        status: 206,
        headers: new Headers({ "Content-Range": "bytes 833-50832/60000" }),
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      const result = await fetchArrayBuffer("https://example.com/data.mp4", 1, {
        offset: 833,
        length: 50000,
      });

      expect(result).toBe(mockBuffer);
      expect(fetchMock).toHaveBeenCalledWith("https://example.com/data.mp4", {
        headers: { Range: "bytes=833-50832" },
        signal: expect.any(AbortSignal),
      });
    });

    it("slices the response when a byteRange request returns the full file", async () => {
      const mockBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
      const mockResponse = {
        arrayBuffer: () => Promise.resolve(mockBuffer),
        ok: true,
        status: 200,
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      const result = await fetchArrayBuffer("https://example.com/data.mp4", 1, {
        offset: 3,
        length: 4,
      });

      expect(new Uint8Array(result)).toEqual(new Uint8Array([3, 4, 5, 6]));
      expect(fetchMock).toHaveBeenCalledWith("https://example.com/data.mp4", {
        headers: { Range: "bytes=3-6" },
        signal: expect.any(AbortSignal),
      });
    });

    it("does not send Range header without byteRange", async () => {
      const mockBuffer = new ArrayBuffer(8);
      const mockResponse = {
        arrayBuffer: () => Promise.resolve(mockBuffer),
        ok: true,
        status: 200,
      };
      const fetchMock = vi.fn().mockResolvedValue(mockResponse);
      globalThis.fetch = fetchMock;

      await fetchArrayBuffer("https://example.com/data.bin");

      expect(fetchMock).toHaveBeenCalledWith("https://example.com/data.bin", {
        signal: expect.any(AbortSignal),
      });
    });

    it("does not retry HTTP errors for array buffers", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 401, arrayBuffer: vi.fn() });
      globalThis.fetch = fetchMock;

      await expect(
        fetchArrayBuffer("https://example.com/protected.bin", 3),
      ).rejects.toThrow("HTTP 401");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
