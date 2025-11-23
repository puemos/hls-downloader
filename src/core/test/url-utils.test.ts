import { describe, expect, it } from "vitest";
import { appendQueryParams } from "../src/utils/url.ts";

describe("appendQueryParams", () => {
  it("appends params from source when target has none", () => {
    const result = appendQueryParams(
      "https://example.com/master.m3u8?session=abc&token=123",
      "https://example.com/level.m3u8"
    );

    expect(result).toBe("https://example.com/level.m3u8?session=abc&token=123");
  });

  it("preserves target params and adds missing ones", () => {
    const result = appendQueryParams(
      "https://example.com/master.m3u8?session=abc&token=123",
      "https://example.com/level.m3u8?session=override"
    );

    expect(result).toBe(
      "https://example.com/level.m3u8?session=override&token=123"
    );
  });

  it("returns target unchanged when source has no search params", () => {
    const target = "https://example.com/level.m3u8";
    const result = appendQueryParams("https://example.com/master.m3u8", target);

    expect(result).toBe(target);
  });
});
