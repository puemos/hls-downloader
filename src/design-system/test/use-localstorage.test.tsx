import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../src/hooks/use-localstorage";

// Mock localStorage for each test
const createMockStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

describe("useLocalStorage", () => {
  beforeEach(() => {
    const localStorage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: localStorage,
      writable: true,
    });
  });

  it("retrieves existing value and parses JSON", () => {
    window.localStorage.setItem(
      "settings",
      JSON.stringify({ theme: "dark" })
    );

    const { result } = renderHook(() =>
      useLocalStorage("settings", { theme: "light" })
    );

    expect(result.current[0]).toEqual({ theme: "dark" });
  });

  it("uses default value and updates storage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("prefs", { theme: "light" })
    );

    expect(result.current[0]).toEqual({ theme: "light" });

    act(() => {
      result.current[1]({ theme: "dark" });
    });

    expect(result.current[0]).toEqual({ theme: "dark" });
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "prefs",
      JSON.stringify({ theme: "dark" })
    );
    expect(window.localStorage.getItem("prefs")).toBe(
      JSON.stringify({ theme: "dark" })
    );
  });
});

