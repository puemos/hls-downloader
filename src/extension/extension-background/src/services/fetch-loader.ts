export function fetchText(url: string) {
  return fetch(url).then((res) => res.text());
}

export function fetchArrayBuffer(url: string) {
  return fetch(url).then((res) => res.arrayBuffer());
}

export async function tryFetchArrayBuffer(url: string, attempts: number) {
  if (attempts === -1)
    attempts = Infinity;
  if (attempts < 1)
    throw new Error("Attempts less then 1");
  attempts = Math.floor(attempts);
  while (attempts--) {
    try {
      return await fetchArrayBuffer(url);
    } catch (e) {
      console.warn(e);
    }
  }
  throw new Error("Fetch error");
}

export async function tryFetchText(url: string, attempts: number) {
  if (attempts === -1)
    attempts = Infinity;
  if (attempts < 1)
    throw new Error("Attempts less then 1");
  attempts = Math.floor(attempts);
  while (attempts--) {
    try {
      return await fetchText(url);
    } catch (e) {
      console.warn(e);
    }
  }
  throw new Error("Fetch error");
}

export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
  tryFetchText,
  tryFetchArrayBuffer,
};
