// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import StorageSummary from "./StorageSummary";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
    container.remove();
  }
});

describe("StorageSummary", () => {
  it("describes flexible browser storage without exposing backend names", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    roots.push({ root, container });

    act(() => {
      root.render(
        <StorageSummary
          usedBytes={11.61 * 1024 * 1024}
          availableBytes={2 * 1024 * 1024 * 1024}
          quotaBytes={2 * 1024 * 1024 * 1024}
          persisted={false}
          quotaExempt
          quotaIsAdvisory
          nearQuota={false}
          loading={false}
          cleanupStatus="idle"
          onCleanup={() => undefined}
        />,
      );
    });

    expect(container.textContent).toContain("Browser storage");
    expect(container.textContent).toContain("No fixed limit");
    expect(container.textContent).toContain(
      "The browser estimate is informational, not a fixed download limit.",
    );
    expect(container.textContent).toContain(
      "Downloads are stored privately by your browser.",
    );
    expect(container.textContent).not.toMatch(/OPFS|IndexedDB/);
    expect(container.textContent).not.toContain("% of browser allowance");
  });
});
