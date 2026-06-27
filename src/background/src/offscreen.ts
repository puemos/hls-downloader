import { IndexedDBFS } from "./services/indexedb-fs";
import type { OutputContainer } from "@hls-downloader/core/lib/entities";

type OffscreenRequest = {
  target?: string;
  type?: string;
  bucketId?: string;
  requestId?: string;
  videoLength?: number;
  audioLength?: number;
  container?: OutputContainer;
};

type OffscreenResponse =
  | { ok: true; url: string }
  | { ok: false; message: string };

chrome.runtime.onMessage.addListener(
  (message: OffscreenRequest, _sender, sendResponse) => {
    if (message?.target !== "offscreen") {
      return;
    }

    if (message.type === "create-object-url") {
      void handleCreateObjectUrl(message)
        .then((response) => sendResponse(response))
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            message: (error as Error)?.message || "Failed to create object URL",
          })
        );
      return true;
    }
  }
);

async function handleCreateObjectUrl(
  message: OffscreenRequest
): Promise<OffscreenResponse> {
  if (!message.bucketId) {
    return { ok: false, message: "Missing bucketId" };
  }

  let bucket = await IndexedDBFS.getBucket(message.bucketId);
  if (!bucket) {
    if (
      typeof message.videoLength === "number" &&
      typeof message.audioLength === "number"
    ) {
      await IndexedDBFS.createBucket(
        message.bucketId,
        message.videoLength,
        message.audioLength
      );
      bucket = await IndexedDBFS.getBucket(message.bucketId);
    }
  }

  if (!bucket) {
    return { ok: false, message: `Bucket ${message.bucketId} not found` };
  }

  const url = await bucket.getLink(
    (progress, status) => {
      if (!message.requestId) {
        return;
      }

      void chrome.runtime.sendMessage({
        target: "background",
        type: "offscreen-progress",
        requestId: message.requestId,
        progress,
        message: status,
      });
    },
    { container: message.container ?? "mp4" }
  );

  return { ok: true, url };
}
