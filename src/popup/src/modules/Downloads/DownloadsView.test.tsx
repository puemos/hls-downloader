// @vitest-environment jsdom
import type { StorageState } from "@hls-downloader/core/lib/store/slices/storage-slice";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import DownloadsView from "./DownloadsView";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const storage: StorageState = {
  loading: false,
  buckets: {},
  totalUsedBytes: 0,
  quotaExempt: false,
  quotaIsAdvisory: false,
  estimateSource: "unknown",
  nearQuota: false,
  cleanupStatus: "idle",
};

const mounted: Array<{
  root: ReturnType<typeof createRoot>;
  container: HTMLDivElement;
}> = [];

afterEach(() => {
  vi.useRealTimers();
  for (const { root, container } of mounted.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

function click(element: Element) {
  act(() => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function renderDownloads(storageState = storage) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ root, container });

  act(() => {
    root.render(
      <DownloadsView
        jobs={[]}
        hasJobs={false}
        showFilterInput={false}
        currentJobId={undefined}
        filter=""
        setCurrentJobId={() => {}}
        setFilter={() => {}}
        storage={storageState}
        onCleanup={() => {}}
        onRefreshStorage={() => {}}
      />,
    );
  });

  return container;
}

describe("DownloadsView storage details", () => {
  it("keeps storage details out of the main layout and opens them in a sheet", () => {
    const container = renderDownloads();

    expect(container.textContent).not.toContain("0 B stored");

    const storageButton = container.querySelector(
      'button[aria-label="Storage details"]',
    );
    expect(storageButton).not.toBeNull();
    click(storageButton!);

    expect(container.querySelector('section[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("0 B stored");

    const closeButton = container.querySelector(
      'section button[aria-label="Close storage details"]',
    );
    expect(closeButton).not.toBeNull();
    vi.useFakeTimers();
    click(closeButton!);

    expect(
      container
        .querySelector('section[role="dialog"]')
        ?.getAttribute("aria-hidden"),
    ).toBe("true");
    act(() => vi.advanceTimersByTime(180));
    expect(container.querySelector('section[role="dialog"]')).toBeNull();
  });

  it("uses a warning control only when storage is near quota", () => {
    const container = renderDownloads({
      ...storage,
      totalUsedBytes: 7.9 * 1024 * 1024 * 1024,
      availableBytes: 100 * 1024 * 1024,
      nearQuota: true,
    });

    expect(
      container.querySelector('button[aria-label="Storage warning"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('button[aria-label="Storage details"]'),
    ).toBeNull();
  });
});
