import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { proxy } from "webextension-polyfill";

function applyProxy(enabled: boolean) {
  if (!proxy?.settings?.set) {
    return;
  }
  proxy.settings.set(
    {
      value: { mode: enabled ? "system" : "direct" },
      scope: "regular",
    },
    () => {}
  );
}

export function setProxyListener(store: ReturnType<typeof createStore>) {
  let current = store.getState().config.proxyEnabled;
  applyProxy(current);
  store.subscribe(() => {
    const next = store.getState().config.proxyEnabled;
    if (next !== current) {
      current = next;
      applyProxy(next);
    }
  });
}
