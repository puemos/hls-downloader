// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureStore, type Middleware } from "@reduxjs/toolkit";
import type { Playlist } from "@hls-downloader/core/lib/entities";
import { rootReducer } from "@hls-downloader/core/lib/store/root-reducer";
import { Provider } from "react-redux";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import SnifferModule from "./SnifferModule";
import {
  levelsSlice,
  levelInspectionsSlice,
} from "@hls-downloader/core/lib/store/slices";
import type { Level } from "@hls-downloader/core/lib/entities";

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
  const actions: any[] = [];
  const recordActions: Middleware = () => (next) => (action) => {
    actions.push(action);
    return next(action);
  };
  const store = configureStore({
    middleware: (getDefault) => getDefault().concat(recordActions),
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

  return { container, store, actions };
}

function addTracks(store: ReturnType<typeof renderSniffer>["store"]) {
  const levels: Level[] = [
    {
      id: "first-1080",
      playlistID: "first",
      type: "stream",
      uri: "1080.m3u8",
      height: 1080,
      audioGroupId: "a",
    },
    {
      id: "first-720",
      playlistID: "first",
      type: "stream",
      uri: "720.m3u8",
      height: 720,
      audioGroupId: "a",
    },
    {
      id: "first-audio",
      playlistID: "first",
      type: "audio",
      uri: "audio.m3u8",
      language: "en",
      groupId: "a",
    },
    {
      id: "second-1080",
      playlistID: "second",
      type: "stream",
      uri: "second.m3u8",
      height: 1080,
    },
  ];
  act(() => {
    store.dispatch(levelsSlice.actions.add({ levels }));
    levels.forEach((level) =>
      store.dispatch(
        levelInspectionsSlice.actions.inspectSuccess({
          inspection: {
            levelId: level.id,
            playlistId: level.playlistID,
            method: null,
            keyUris: [],
            supported: true,
          },
        }),
      ),
    );
  });
}

function button(container: HTMLElement, text: string) {
  return [...container.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  )!;
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
  it("selects only visible streams and preserves selection across filters", () => {
    const { container } = renderSniffer();
    click(button(container, "Select"));
    const input = container.querySelector(
      'input[aria-label="Filter captured streams"]',
    ) as HTMLInputElement;
    changeInput(input, "First Video");
    click(button(container, "Select visible"));
    expect(container.textContent).toContain("1 selected");
    changeInput(input, "Second Video");
    expect(
      container
        .querySelector('[role="checkbox"]')
        ?.getAttribute("aria-checked"),
    ).toBe("false");
    click(container.querySelector('[role="checkbox"]')!);
    expect(container.textContent).toContain("2 selected");
    click(button(container, "Deselect visible"));
    expect(container.textContent).toContain("1 selected");
    changeInput(input, "");
    expect(
      container
        .querySelector('[aria-label="Select First Video"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      container
        .querySelector('[aria-label="Select Second Video"]')
        ?.getAttribute("aria-checked"),
    ).toBe("false");
    expect(container.querySelector("[data-detail-screen]")).toBeNull();
  });

  it("reviews per-stream quality, skips unavailable capped quality and queues ready selections once", () => {
    const { container, store, actions } = renderSniffer();
    addTracks(store);
    click(button(container, "Select"));
    click(button(container, "Select visible"));
    click(button(container, "Review 2 streams"));
    expect(container.querySelectorAll("[data-bulk-review-row]")).toHaveLength(
      2,
    );
    expect(container.textContent).toContain("1080p · en");
    const quality = container.querySelector(
      'select[aria-label="Bulk video quality"]',
    ) as HTMLSelectElement;
    act(() => {
      quality.value = "720";
      quality.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(container.textContent).toContain("720p · en");
    expect(container.textContent).toContain(
      "No video quality at or below 720p",
    );
    const queue = button(container, "Queue 1 download");
    click(queue);
    click(queue);
    expect(actions.filter(levelsSlice.actions.download.match)).toEqual([
      levelsSlice.actions.download({
        levelID: "first-720",
        audioLevelID: "first-audio",
        subtitleLevelID: undefined,
      }),
    ]);
  });

  it("blocks known unsupported encryption and waits for unchecked streams", () => {
    const { container, store, actions } = renderSniffer();
    addTracks(store);
    act(() => {
      store.dispatch(levelInspectionsSlice.actions.clear());
      store.dispatch(
        levelInspectionsSlice.actions.inspectSuccess({
          inspection: {
            levelId: "first-1080",
            playlistId: "first",
            method: "SAMPLE-AES",
            keyUris: [],
            supported: false,
            message: "Unsupported encryption: SAMPLE-AES",
          },
        }),
      );
    });
    click(button(container, "Select"));
    click(button(container, "Select visible"));
    click(button(container, "Review 2 streams"));
    expect(container.textContent).toContain(
      "Unsupported encryption: SAMPLE-AES",
    );
    expect(container.textContent).toContain("Checking stream");
    expect(button(container, "Queue 0 downloads").disabled).toBe(true);
    expect(actions.filter(levelsSlice.actions.download.match)).toHaveLength(0);
    expect(
      actions
        .filter(levelInspectionsSlice.actions.inspect.match)
        .map((a) => a.payload.levelId)
        .sort(),
    ).toEqual(["first-audio", "second-1080"]);
  });

  it("clears selection on cancel and ignores streams removed during selection", () => {
    const { container, store } = renderSniffer();
    click(button(container, "Select"));
    click(button(container, "Select visible"));
    click(button(container, "Cancel"));
    click(button(container, "Select"));
    expect(container.textContent).toContain("0 selected");
    click(button(container, "Select visible"));
    act(() =>
      store.dispatch({
        type: "playlists/removePlaylist",
        payload: { playlistID: "first" },
      }),
    );
    expect(container.textContent).toContain("1 selected");
  });

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
