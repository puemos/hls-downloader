export function fetchText(url: string) {
  return fetch(url).then((res) => res.text());
}

export function fetchArrayBuffer(url: string) {
  return fetch(url).then((res) => res.arrayBuffer());
}

export const FetchLoader = {
  fetchText,
  fetchArrayBuffer,
};
