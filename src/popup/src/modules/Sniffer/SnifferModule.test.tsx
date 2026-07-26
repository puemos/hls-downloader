// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import type { Playlist } from "@hls-downloader/core/lib/entities";
import { rootReducer } from "@hls-downloader/core/lib/store/root-reducer";
import { Provider } from "react-redux";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import SnifferModule from "./SnifferModule";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

const createPlaylist = (
  id: string,
  uri: string,
  createdAt: number,
  pageTitle: string,
): Playlist =>
  ({
    id,
    uri,
    createdAt,
    pageTitle,
    initiator: "hls.js",
  }) as Playlist;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
});

function renderSniffer() {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      playlists: {
        playlists: {
          first: createPlaylist(
            "first",
            "https://example.com/first.m3u8",
            2,
            "First Video",
          ),
          second: createPlaylist(
            "second",
            "https://example.com/second.m3u8",
            1,
            "Second Video",
          ),
        },
        playlistsStatus: {
          first: { status: "ready" },
          second: { status: "ready" },
        },
      },
    } as any,
  });

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });

  act(() => {
    root.render(
      <Provider store={store}>
        <SnifferModule />
      </Provider>,
    );
  });

  return { container, store };
}

function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function changeInput(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  act(() => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("SnifferModule", () => {
  it("keeps the filter accessible when no streams match", () => {
    const { container } = renderSniffer();
    const filterInput = container.querySelector(
      'input[aria-label="Filter captured streams"]',
    ) as HTMLInputElement;

    changeInput(filterInput, "missing title");

    expect(
      container.querySelector('input[aria-label="Filter captured streams"]'),
    ).not.toBeNull();
    expect(container.textContent).toContain("No matching streams");
    expect(container.textContent).toContain("Clear filter");
    expect(container.textContent).not.toContain("Ready to detect a stream");
  });

  it("opens quality selection on the first playlist click", () => {
    const { container } = renderSniffer();

    const openButton = container.querySelector(
      'button[aria-label="Choose quality for First Video"]',
    );
    expect(openButton).not.toBeNull();
    click(openButton!);

    expect(container.querySelector("[data-detail-screen]")).not.toBeNull();
    expect(container.textContent).toContain("First Video");
  });

  it("removes one sniffed playlist without clearing the list", () => {
    const { container, store } = renderSniffer();

    expect(container.textContent).toContain("First Video");
    expect(container.textContent).toContain("Second Video");

    const removeButton = container.querySelector(
      'button[aria-label="Remove First Video"]',
    );
    expect(removeButton).not.toBeNull();
    click(removeButton!);

    expect(container.textContent).not.toContain("First Video");
    expect(container.textContent).toContain("Second Video");
    expect(store.getState().playlists.playlists.first).toBeUndefined();
    expect(store.getState().playlists.playlists.second?.uri).toBe(
      "https://example.com/second.m3u8",
    );
  });

  it("shows successful feedback after copying a playlist URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { container } = renderSniffer();
    const copyButton = container.querySelector(
      'button[aria-label="Copy URL for First Video"]',
    );
    expect(copyButton).not.toBeNull();

    await act(async () => {
      copyButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith("https://example.com/first.m3u8");
    expect(
      container.querySelector(
        'button[aria-label="URL copied for First Video"]',
      ),
    ).not.toBeNull();
  });
});
