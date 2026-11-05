import { describe, expect, it } from "vitest";
import { formatSpeed, formatTimeLeft } from "./format-speed";

describe("formatSpeed", () => {
  it("formats bytes per second", () => {
    expect(formatSpeed(512)).toBe("512 B/s");
    expect(formatSpeed(2.5 * 1024 * 1024)).toBe("2.5 MB/s");
  });
});

describe("formatTimeLeft", () => {
  it.each([
    [0.2, "1s left"],
    [42, "42s left"],
    [59.6, "1m left"],
    [125, "2m left"],
    [3600, "1h left"],
    [3 * 3600 + 25 * 60, "3h 25m left"],
  ])("formats %s seconds as %j", (seconds, label) => {
    expect(formatTimeLeft(seconds)).toBe(label);
  });
});
