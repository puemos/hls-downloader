type FetchFn<Data> = () => Promise<Data>;

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
      const message = (e as Error)?.message ?? "";
      if (message.startsWith("HTTP ")) {
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
        throw new Error(`HTTP ${res.status}`);
      }
      return res.text();
    });
  return fetchWithRetry(fetchFn, attempts);
}

export async function fetchArrayBuffer(url: string, attempts: number = 1) {
  const fetchFn: FetchFn<ArrayBuffer> = () =>
    fetch(url).then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.arrayBuffer();
    });
  return fetchWithRetry(fetchFn, attempts);
}
export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
};
