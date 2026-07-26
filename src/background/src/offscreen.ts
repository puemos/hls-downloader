import type { PreparedDownload } from "@hls-downloader/core/lib/services";
import {
  prepareDownloadInCurrentContext,
  prepareTextDownloadInCurrentContext,
  releaseArtifactInCurrentContext,
  type PrepareDownloadPayload,
} from "./services/disk-backed-fs";
import { cancelDiskBackedMux } from "./services/disk-mux-client";

const chromeApi = (globalThis as any).chrome;

type OffscreenRequest = {
  target?: string;
  type?: string;
  requestId?: string;
  payload?: PrepareDownloadPayload;
  artifact?: PreparedDownload;
  storageKey?: string;
  text?: string;
  mime?: string;
};

type OffscreenResponse =
  { ok: true; download?: PreparedDownload } | { ok: false; message: string };

chromeApi.runtime.onMessage.addListener(
  (
    message: OffscreenRequest,
    _sender: unknown,
    sendResponse: (response: OffscreenResponse) => void,
  ) => {
    if (message?.target !== "offscreen") {
      return;
    }

    if (message.type === "prepare-download") {
      void handlePrepareDownload(message)
        .then((response) => sendResponse(response))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            message:
              (error as Error)?.message || "Failed to prepare the download",
          }),
        );
      return true;
    }

    if (message.type === "release-artifact") {
      void handleReleaseArtifact(message)
        .then((response) => sendResponse(response))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            message:
              (error as Error)?.message || "Failed to release the download",
          }),
        );
      return true;
    }

    if (message.type === "cancel-mux") {
      void handleCancelMux(message)
        .then((response) => sendResponse(response))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            message:
              (error as Error)?.message || "Failed to cancel finalization",
          }),
        );
      return true;
    }

    if (message.type === "prepare-text-download") {
      void handlePrepareTextDownload(message)
        .then((response) => sendResponse(response))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            message:
              (error as Error)?.message || "Failed to prepare text download",
          }),
        );
      return true;
    }
  },
);

async function handlePrepareDownload(
  message: OffscreenRequest,
): Promise<OffscreenResponse> {
  if (!message.payload) {
    return { ok: false, message: "Missing download payload" };
  }

  const download = await prepareDownloadInCurrentContext(
    message.payload,
    (progress, status) => {
      if (!message.requestId) {
        return;
      }

      void chromeApi.runtime.sendMessage({
        target: "background",
        type: "offscreen-progress",
        requestId: message.requestId,
        progress,
        message: status,
      });
    },
  );

  return { ok: true, download };
}

async function handleReleaseArtifact(
  message: OffscreenRequest,
): Promise<OffscreenResponse> {
  if (!message.artifact) {
    return { ok: false, message: "Missing download artifact" };
  }
  await releaseArtifactInCurrentContext(message.artifact);
  return { ok: true };
}

async function handleCancelMux(
  message: OffscreenRequest,
): Promise<OffscreenResponse> {
  if (!message.storageKey) {
    return { ok: false, message: "Missing storage key" };
  }
  await cancelDiskBackedMux(message.storageKey);
  return { ok: true };
}

async function handlePrepareTextDownload(
  message: OffscreenRequest,
): Promise<OffscreenResponse> {
  if (message.text === undefined || !message.mime) {
    return { ok: false, message: "Missing text download data" };
  }
  const download = prepareTextDownloadInCurrentContext(
    message.text,
    message.mime,
  );
  return { ok: true, download };
}
