import fetch from "node-fetch";

export async function fetchText(url: string) {
  const res = await fetch(url);
  return await res.text();
}

export async function fetchArrayBuffer(url: string) {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

export const Fetch = {
  fetchText,
  fetchArrayBuffer,
};
