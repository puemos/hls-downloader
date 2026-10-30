import { beforeEach, describe, expect, it, vi } from "vitest";
const browser = vi.hoisted(() => ({
  addListener: vi.fn(),
  getTab: vi.fn(),
  setIcon: vi.fn(),
  blocked: vi.fn(),
}));
vi.mock("webextension-polyfill", () => ({
  webRequest: { onCompleted: { addListener: browser.addListener } },
  tabs: { get: browser.getTab },
  browserAction: { setIcon: browser.setIcon },
  action: { setIcon: browser.setIcon },
}));
vi.mock("../src/blocklist", () => ({ isBlocked: browser.blocked }));
import { addPlaylistListener } from "../src/listeners/addPlaylistListener";

describe("playlist capture", () => {
  let store: any;
  let listener: (details: any) => Promise<void>;
  const details = (url: string, type: string, statusCode = 200) => ({
    url,
    tabId: 10,
    statusCode,
    initiator: "https://example.com/",
    responseHeaders: [{ name: "Content-Type", value: type }],
  });
  beforeEach(() => {
    vi.resetAllMocks();
    browser.getTab.mockResolvedValue({
      id: 10,
      title: "Video",
      url: "https://example.com/watch",
    });
    browser.setIcon.mockResolvedValue(undefined);
    browser.blocked.mockReturnValue(false);
    store = {
      getState: () => ({ playlists: { playlists: {} } }),
      dispatch: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
    addPlaylistListener(store);
    listener = browser.addListener.mock.calls[0][0];
  });

  it("observes extensionless XHR and native media responses", () => {
    const filter = browser.addListener.mock.calls[0][1];
    expect(filter.urls).toEqual(["http://*/*", "https://*/*"]);
    expect(filter.types).toEqual(
      expect.arrayContaining(["xmlhttprequest", "media"]),
    );
  });

  it.each([
    "application/vnd.apple.mpegurl",
    "application/x-mpegurl",
    "audio/mpegurl",
    "audio/x-mpegurl",
    "Audio/MpegURL; charset=utf-8",
  ])("captures a playlist served as %s", async (mime) => {
    await listener(
      details("https://cdn.example.com/master.m3u8?token=value", mime),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "playlists/addPlaylist" }),
    );
  });

  it.each(["master.m3u8", "master.m3u", "MASTER.M3U8"])(
    "captures %s when a server uses a generic type",
    async (name) => {
      await listener(
        details(
          `https://cdn.example.com/${name}?token=value`,
          "application/octet-stream",
        ),
      );
      expect(store.dispatch).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    "application/json",
    "text/html",
    "video/mp4",
    "audio/mpeg",
    "application/x-mpegurl-fake",
  ])("ignores unrelated %s responses", async (mime) => {
    await listener(details("https://cdn.example.com/resource", mime));
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it.each([403, 404, 500])(
    "ignores failed HTTP %i responses even for an HLS URL",
    async (status) => {
      await listener(
        details("https://cdn.example.com/master.m3u8", "audio/mpegurl", status),
      );
      expect(store.dispatch).not.toHaveBeenCalled();
    },
  );

  it("ignores blocked initiators", async () => {
    browser.blocked.mockReturnValue(true);
    await listener(
      details("https://cdn.example.com/master.m3u8", "audio/mpegurl"),
    );
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it("handles a tab closing before its response is processed", async () => {
    browser.getTab.mockRejectedValue(new Error("No tab with id 10"));
    await expect(
      listener(
        details(
          "https://cdn.example.com/master.m3u8",
          "application/vnd.apple.mpegurl",
        ),
      ),
    ).resolves.toBeUndefined();
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
