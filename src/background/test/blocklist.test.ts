import { describe, it, expect } from "vitest";
import { isBlocked } from "../src/blocklist";

describe("Blocklist", () => {
  it("should block exact matches", () => {
    expect(isBlocked("https://tiktok.com")).toBe(true);
    expect(isBlocked("http://douyin.com")).toBe(true);
  });

  it("should block subdomains", () => {
    expect(isBlocked("https://www.tiktok.com")).toBe(true);
    expect(isBlocked("https://v.douyin.com")).toBe(true);
    expect(isBlocked("https://sub.domain.tiktok.com")).toBe(true);
  });

  it("should not block partial matches that are not subdomains", () => {
    expect(isBlocked("https://tiktok.com.example.com")).toBe(false); // This is actually a subdomain of example.com, so it shouldn't be blocked if we check properly
    expect(isBlocked("https://mytiktok.com")).toBe(false);
  });

  it("should not block unrelated domains", () => {
    expect(isBlocked("https://google.com")).toBe(false);
    expect(isBlocked("https://example.com")).toBe(false);
  });

  it("should handle URLs with paths and query parameters", () => {
    expect(isBlocked("https://tiktok.com/video/123")).toBe(true);
    expect(isBlocked("https://www.douyin.com?foo=bar")).toBe(true);
  });
});
