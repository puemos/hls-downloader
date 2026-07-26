import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  prepareText: vi.fn(),
  release: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock("../src/services/disk-backed-fs", () => ({
  prepareDownloadInCurrentContext: mocks.prepare,
  prepareTextDownloadInCurrentContext: mocks.prepareText,
  releaseArtifactInCurrentContext: mocks.release,
}));

vi.mock("../src/services/disk-mux-client", () => ({
  cancelDiskBackedMux: mocks.cancel,
}));

describe("Chromium offscreen artifact owner", () => {
  let listener: (
    message: any,
    sender: unknown,
    sendResponse: (response: any) => void,
  ) => boolean | undefined;
  const sendMessage = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    vi.stubGlobal("chrome", {
      runtime: {
        onMessage: {
          addListener: vi.fn((value: typeof listener) => {
            listener = value;
          }),
        },
        sendMessage,
      },
    });
    await import("../src/offscreen");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prepare.mockResolvedValue({
      url: "blob:media",
      exportId: "media.mp4",
      mime: "video/mp4",
      size: 10,
    });
    mocks.prepareText.mockReturnValue({
      url: "blob:text",
      exportId: "legacy-text-1",
      mime: "text/vtt",
      size: 6,
    });
    mocks.release.mockResolvedValue(undefined);
    mocks.cancel.mockResolvedValue(undefined);
  });

  async function dispatch(message: any): Promise<any> {
    return await new Promise((resolve) => {
      expect(listener(message, undefined, resolve)).toBe(true);
    });
  }

  it("owns media muxing and forwards progress to the service worker", async () => {
    const payload = {
      bucketId: "job",
      backend: "opfs-v1",
      storageKey: "storage",
      videoLength: 1,
      audioLength: 1,
      container: "mp4",
    };
    mocks.prepare.mockImplementation(
      async (_payload: unknown, onProgress: Function) => {
        onProgress(0.5, "Muxing");
        return {
          url: "blob:media",
          exportId: "media.mp4",
          mime: "video/mp4",
          size: 10,
        };
      },
    );

    await expect(
      dispatch({
        target: "offscreen",
        type: "prepare-download",
        requestId: "request",
        payload,
      }),
    ).resolves.toEqual({
      ok: true,
      download: expect.objectContaining({ exportId: "media.mp4" }),
    });
    expect(mocks.prepare).toHaveBeenCalledWith(payload, expect.any(Function));
    expect(sendMessage).toHaveBeenCalledWith({
      target: "background",
      type: "offscreen-progress",
      requestId: "request",
      progress: 0.5,
      message: "Muxing",
    });
  });

  it("creates text URLs, releases leases, and cancels the owning worker", async () => {
    await expect(
      dispatch({
        target: "offscreen",
        type: "prepare-text-download",
        text: "WEBVTT",
        mime: "text/vtt",
      }),
    ).resolves.toEqual({
      ok: true,
      download: expect.objectContaining({ exportId: "legacy-text-1" }),
    });
    expect(mocks.prepareText).toHaveBeenCalledWith("WEBVTT", "text/vtt");

    const artifact = {
      url: "blob:media",
      exportId: "media.mp4",
      mime: "video/mp4",
      size: 10,
    };
    await expect(
      dispatch({
        target: "offscreen",
        type: "release-artifact",
        artifact,
      }),
    ).resolves.toEqual({ ok: true });
    expect(mocks.release).toHaveBeenCalledWith(artifact);

    await expect(
      dispatch({
        target: "offscreen",
        type: "cancel-mux",
        storageKey: "storage",
      }),
    ).resolves.toEqual({ ok: true });
    expect(mocks.cancel).toHaveBeenCalledWith("storage");
  });
});
