import { describe, it, expect, beforeEach, vi } from "vitest";
import { TabOptions } from "../src/modules/Navbar/types";

const store = { value: undefined as any };

vi.mock("@hls-downloader/design-system", () => ({
  useLocalStorage: (key: string, initial: any) => {
    if (store.value === undefined) store.value = initial;
    const setValue = (value: any) => {
      store.value = value;
    };
    return [store.value, setValue];
  },
}));

import useRouterController from "../src/modules/Navbar/RouterController";

describe("useRouterController", () => {
  beforeEach(() => {
    store.value = undefined;
  });

  it("persists valid tabs", () => {
    const { setTab } = useRouterController();
    setTab(TabOptions.ABOUT);

    expect(store.value).toBe(TabOptions.ABOUT);

    const { tab } = useRouterController();
    expect(tab).toBe(TabOptions.ABOUT);
  });

  it("falls back to DEFAULT_TAB for invalid tabs", () => {
    const { setTab } = useRouterController();
    setTab("invalid" as any);

    expect(store.value).toBe(TabOptions.SNIFTER);

    const { tab } = useRouterController();
    expect(tab).toBe(TabOptions.SNIFTER);
  });

  it("updates state when setTab is called", () => {
    let controller = useRouterController();
    expect(controller.tab).toBe(TabOptions.SNIFTER);

    controller.setTab(TabOptions.ABOUT);
    controller = useRouterController();
    expect(controller.tab).toBe(TabOptions.ABOUT);

    controller.setTab(TabOptions.DOWNLOADS);
    controller = useRouterController();
    expect(controller.tab).toBe(TabOptions.DOWNLOADS);
  });
});

