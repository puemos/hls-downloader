type FetchFn<Data> = () => Promise<Data>;

class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

function isHttpError(error: unknown): error is HttpError {
  return typeof (error as any)?.status === "number";
}

async function fetchWithRetry<Data>(
  fetchFn: FetchFn<Data>,
  attempts: number = 1
): Promise<Data> {
  if (attempts < 1) {
    throw new Error("Attempts less then 1");
  }
  let countdown = attempts;
  let retryTime = 100;
  let lastError: unknown;
  while (countdown--) {
    try {
      return await fetchFn();
    } catch (e) {
      lastError = e;
      if (isHttpError(e)) {
        throw e;
      }
      if (countdown > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryTime));
        retryTime *= 1.15;
      }
    }
  }
  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Fetch error");
}

export async function fetchText(url: string, attempts: number = 1) {
  const fetchFn: FetchFn<string> = () =>
    fetch(url).then((res) => {
      if (!res.ok) {
        throw new HttpError(res.status);
      }
      return res.text();
    });
  return fetchWithRetry(fetchFn, attempts);
}

export async function fetchArrayBuffer(url: string, attempts: number = 1) {
  const fetchFn: FetchFn<ArrayBuffer> = () =>
    fetch(url).then((res) => {
      if (!res.ok) {
        throw new HttpError(res.status);
      }
      return res.arrayBuffer();
    });
  return fetchWithRetry(fetchFn, attempts);
}
export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
};
