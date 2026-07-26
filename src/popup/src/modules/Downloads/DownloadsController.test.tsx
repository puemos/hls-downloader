// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { Job } from "@hls-downloader/core/lib/entities";
import { rootReducer } from "@hls-downloader/core/lib/store/root-reducer";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import useDownloadsController from "./DownloadsController";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const Probe = () => {
  const { filter, setFilter, jobs, hasJobs, showFilterInput } =
    useDownloadsController();

  return (
    <>
      <input
        aria-label="Probe filter"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <span data-testid="has-jobs">{String(hasJobs)}</span>
      <span data-testid="show-filter">{String(showFilterInput)}</span>
      <span data-testid="job-count">{jobs.length}</span>
    </>
  );
};

describe("useDownloadsController", () => {
  it("keeps the filter visible when existing jobs do not match", () => {
    const baseState = rootReducer(undefined, { type: "init" });
    const job = new Job(
      "job-1",
      undefined,
      [],
      [],
      "Example video.mp4",
      Date.now(),
    );
    const store = configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...baseState,
        jobs: {
          ...baseState.jobs,
          jobs: { [job.id]: job },
        },
      },
    });
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(
        <Provider store={store}>
          <Probe />
        </Provider>,
      );
    });

    const input = container.querySelector(
      'input[aria-label="Probe filter"]',
    ) as HTMLInputElement;
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    act(() => {
      valueSetter?.call(input, "missing");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(
      container.querySelector('[data-testid="job-count"]')?.textContent,
    ).toBe("0");
    expect(
      container.querySelector('[data-testid="has-jobs"]')?.textContent,
    ).toBe("true");
    expect(
      container.querySelector('[data-testid="show-filter"]')?.textContent,
    ).toBe("true");

    act(() => root.unmount());
  });
});
