// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
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
  pageTitle: string
): Playlist =>
  ({
    id,
    uri,
    createdAt,
    pageTitle,
    initiator: "hls.js",
  } as Playlist);

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
            "First Video"
          ),
          second: createPlaylist(
            "second",
            "https://example.com/second.m3u8",
            1,
            "Second Video"
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
      </Provider>
    );
  });

  return { container, store };
}

function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("SnifferModule", () => {
  it("removes one sniffed playlist without clearing the list", () => {
    const { container, store } = renderSniffer();

    expect(container.textContent).toContain("First Video");
    expect(container.textContent).toContain("Second Video");

    const toggles = container.querySelectorAll(
      'button[aria-label="Toggle playlist details"]'
    );
    click(toggles[0]);

    const removeButtons = Array.from(
      container.querySelectorAll("button")
    ).filter((button) => button.textContent?.includes("Remove"));
    click(removeButtons[0]);

    expect(container.textContent).not.toContain("First Video");
    expect(container.textContent).toContain("Second Video");
    expect(store.getState().playlists.playlists.first).toBeUndefined();
    expect(store.getState().playlists.playlists.second?.uri).toBe(
      "https://example.com/second.m3u8"
    );
  });
});
