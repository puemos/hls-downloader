import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { fetchArrayBuffer } from "../src/services/fetch-loader";

const bytes = Uint8Array.from({ length: 32 }, (_, index) => index);
const attempts = new Map<string, number>();
let server: http.Server;
let base: string;
beforeAll(async () => {
  server = http.createServer((request, response) => {
    const name = request.url!.split("?")[0];
    const count = (attempts.get(name) ?? 0) + 1;
    attempts.set(name, count);
    let body = bytes.slice(8, 16);
    let range: string | undefined = "bytes 8-15/32";
    let status = 206;
    if (name === "/full" || (name === "/short-full" && count > 1)) {
      body = bytes;
      status = 200;
      range = undefined;
    } else if (name === "/legacy-exact") {
      status = 200;
      range = undefined;
    } else if (name === "/short-full") {
      body = bytes.slice(0, 12);
      status = 200;
      range = undefined;
    } else if (count === 1 || name === "/permanently-short") {
      if (name === "/short" || name === "/permanently-short")
        body = body.slice(0, 4);
      if (name === "/wrong") {
        body = bytes.slice(0, 8);
        range = "bytes 0-7/32";
      }
      if (name === "/missing") range = undefined;
      if (name === "/invalid-total") range = "bytes 8-15/12";
    }
    response.writeHead(status, {
      ...(range ? { "Content-Range": range } : {}),
    });
    response.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("byte-range response integrity", () => {
  it.each(["short", "wrong", "missing", "invalid-total", "short-full"])(
    "retries a %s response before returning exact media bytes",
    async (name) => {
      const result = await fetchArrayBuffer(`${base}/${name}`, 2, {
        offset: 8,
        length: 8,
      });
      expect(new Uint8Array(result)).toEqual(bytes.slice(8, 16));
      expect(attempts.get("/" + name)).toBe(2);
    },
  );
  it("fails instead of returning permanently truncated media", async () => {
    await expect(
      fetchArrayBuffer(`${base}/permanently-short`, 2, {
        offset: 8,
        length: 8,
      }),
    ).rejects.toThrow(/range|bytes/i);
    expect(attempts.get("/permanently-short")).toBe(2);
  });
  it.each(["full", "legacy-exact"])(
    "preserves the existing %s HTTP 200 fallback",
    async (name) => {
      expect(
        new Uint8Array(
          await fetchArrayBuffer(`${base}/${name}`, 1, {
            offset: 8,
            length: 8,
          }),
        ),
      ).toEqual(bytes.slice(8, 16));
    },
  );
});
