import { describe, it, expect, vi } from "vitest";
import { configSlice } from "@hls-downloader/core/lib/store/slices";
import { setProxyListener } from "../src/listeners/setProxyListener";
import { proxy } from "webextension-polyfill";

vi.mock("webextension-polyfill", () => ({
  proxy: { settings: { set: vi.fn() } },
}));

describe("setProxyListener", () => {
  it("updates proxy settings when toggled", () => {
    let state = { config: { proxyEnabled: false } };
    const listeners: Array<() => void> = [];
    const store = {
      getState: () => state,
      subscribe: (fn: () => void) => {
        listeners.push(fn);
      },
      dispatch: (action: any) => {
        state = { config: configSlice.reducer(state.config, action) } as any;
        listeners.forEach((fn) => fn());
      },
    } as any;
    setProxyListener(store);
    store.dispatch(
      configSlice.actions.setProxyEnabled({ proxyEnabled: true })
    );
    expect(proxy.settings.set).toHaveBeenCalledWith(
      { value: { mode: "system" }, scope: "regular" },
      expect.any(Function)
    );
    store.dispatch(
      configSlice.actions.setProxyEnabled({ proxyEnabled: false })
    );
    expect(proxy.settings.set).toHaveBeenCalledWith(
      { value: { mode: "direct" }, scope: "regular" },
      expect.any(Function)
    );
  });
});
