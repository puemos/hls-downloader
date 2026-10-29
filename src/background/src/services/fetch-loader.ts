type FetchFn<Data> = () => Promise<Data>;

const REQUEST_IDLE_MS = 30_000;
const MAX_RETRY_DELAY_MS = 2_000;
const MAX_RETRY_AFTER_MS = 60_000;
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs = 0,
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

function retryAfter(response: Response): number {
  const value = response.headers?.get("Retry-After");
  if (!value) return 0;
  const delay = /^\d+$/.test(value.trim())
    ? Number(value) * 1000
    : Date.parse(value) - Date.now();
  return Number.isFinite(delay) ? Math.max(0, delay) : 0;
}

async function fetchResponse<Data>(
  url: string,
  request: RequestInit | undefined,
  read: (response: Response) => Promise<Data>,
  signal?: AbortSignal,
): Promise<Data> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  let timer: ReturnType<typeof setTimeout>;
  const resetWatchdog = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      controller.abort(
        new Error("Request stalled for 30 seconds without data"),
      );
    }, REQUEST_IDLE_MS);
  };
  resetWatchdog();
  try {
    const response = await fetch(url, {
      ...request,
      signal: controller.signal,
    });
    resetWatchdog();
    if (!response.ok) {
      const error = new HttpError(response.status, retryAfter(response));
      await response.body?.cancel().catch(() => undefined);
      throw error;
    }
    // Watch for inactivity rather than total transfer time: slow streams may
    // keep delivering bytes for longer than the timeout without being stalled.
    const monitored = response.body
      ? new Response(
          response.body.pipeThrough(
            new TransformStream({
              transform(chunk, output) {
                resetWatchdog();
                output.enqueue(chunk);
              },
            }),
          ),
          {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          },
        )
      : response;
    return await read(monitored);
  } finally {
    clearTimeout(timer!);
    signal?.removeEventListener("abort", abort);
  }
}

function waitForRetry(delay: number, signal?: AbortSignal): Promise<void> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, delay);
    signal?.addEventListener("abort", abort, { once: true });
  });
}

async function fetchWithRetry<Data>(
  fetchFn: FetchFn<Data>,
  attempts: number = 1,
  signal?: AbortSignal,
): Promise<Data> {
  if (attempts < 1) {
    throw new Error("Attempts less then 1");
  }
  let countdown = attempts;
  let retryTime = 100;
  let lastError: unknown;
  while (countdown--) {
    signal?.throwIfAborted();
    try {
      return await fetchFn();
    } catch (e) {
      lastError = e;
      signal?.throwIfAborted();
      if (
        isHttpError(e) &&
        (!RETRYABLE_STATUSES.has(e.status) ||
          e.retryAfterMs > MAX_RETRY_AFTER_MS)
      ) {
        throw e;
      }
      if (countdown > 0) {
        const delay = Math.max(retryTime, isHttpError(e) ? e.retryAfterMs : 0);
        await waitForRetry(delay, signal);
        retryTime = Math.min(retryTime * 1.15, MAX_RETRY_DELAY_MS);
      }
    }
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Fetch error");
}

export async function fetchText(
  url: string,
  attempts: number = 1,
  signal?: AbortSignal,
) {
  const fetchFn: FetchFn<string> = () =>
    fetchResponse(url, undefined, (response) => response.text(), signal);
  return fetchWithRetry(fetchFn, attempts, signal);
}

export async function fetchArrayBuffer(
  url: string,
  attempts: number = 1,
  byteRange?: { offset: number; length: number } | null,
  signal?: AbortSignal,
) {
  const fetchFn: FetchFn<ArrayBuffer> = () => {
    const request = byteRange
      ? {
          headers: {
            Range: `bytes=${byteRange.offset}-${
              byteRange.offset + byteRange.length - 1
            }`,
          },
        }
      : undefined;
    return fetchResponse(
      url,
      request,
      async (res) => {
        const buffer = await res.arrayBuffer();
        if (
          byteRange &&
          res.status !== 206 &&
          buffer.byteLength !== byteRange.length
        ) {
          return buffer.slice(
            byteRange.offset,
            byteRange.offset + byteRange.length,
          );
        }
        return buffer;
      },
      signal,
    );
  };
  return fetchWithRetry(fetchFn, attempts, signal);
}
export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
};
