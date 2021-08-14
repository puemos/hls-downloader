export async function fetchText(url: string, attempts: number = 1) {
  if (attempts < 1) {
    throw new Error("Attempts less then 1");
  }
  while (attempts--) {
    try {
      return await fetch(url).then((res) => res.text());
    } catch (e) {
      console.warn(e);
    }
  }
  throw new Error("Fetch error");
}

export async function fetchArrayBuffer(url: string, attempts: number = 1) {
  if (attempts < 1) {
    throw new Error("Attempts less then 1");
  }
  while (attempts--) {
    try {
      return await fetch(url).then((res) => res.arrayBuffer());
    } catch (e) {
      console.warn(e);
    }
  }
  throw new Error("Fetch error");
}

export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
};
