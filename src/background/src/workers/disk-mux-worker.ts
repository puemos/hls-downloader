import { buildMuxArgs, detectFmp4 } from "../services/ffmpeg-muxer";
import type {
  DiskMuxRequest,
  DiskMuxResponse,
} from "../services/disk-mux-protocol";
import {
  deleteExportFile,
  getExportHandle,
  getFragmentFile,
  type MediaTrack,
} from "../services/opfs-storage";
import {
  OPFS_OUTPUT_DEVICE_PATH,
  registerSeekableOpfsOutputDevice,
} from "../services/seekable-opfs-output";

type FFmpegCore = any;

const workerScope = globalThis as any;

type MountedInput = {
  fileName: string;
  container: "mp4" | "mpegts";
  mountPoint: string;
  listFileName?: string;
};

function post(message: DiskMuxResponse): void {
  workerScope.postMessage(message);
}

function progress(requestId: string, value: number, message: string): void {
  post({
    type: "progress",
    requestId,
    progress: Math.max(0, Math.min(1, value)),
    message,
  });
}

async function loadCore(
  coreURL: string,
  wasmURL: string,
  requestId: string,
): Promise<FFmpegCore> {
  progress(requestId, 0.01, "Loading FFmpeg");
  const module = await import(/* @vite-ignore */ coreURL);
  const createFFmpegCore = module.default;
  if (typeof createFFmpegCore !== "function") {
    throw new Error("The bundled FFmpeg core could not be loaded");
  }

  const mainScriptUrlOrBlob = `${coreURL}#${btoa(
    JSON.stringify({ wasmURL, workerURL: "" }),
  )}`;
  const core = await createFFmpegCore({ mainScriptUrlOrBlob });
  core.setProgress?.(({ progress: value }: { progress: number }) => {
    progress(requestId, 0.1 + Math.max(0, Math.min(1, value)) * 0.85, "Muxing");
  });
  return core;
}

async function mountTrack(
  core: FFmpegCore,
  storageKey: string,
  track: MediaTrack,
  length: number,
): Promise<MountedInput | undefined> {
  if (length === 0) {
    return undefined;
  }

  const files: File[] = [];
  const missing: number[] = [];
  for (let index = 0; index < length; index++) {
    try {
      files.push(await getFragmentFile(storageKey, track, index));
    } catch (error) {
      if ((error as DOMException)?.name === "NotFoundError") {
        missing.push(index);
        continue;
      }
      throw error;
    }
  }

  if (missing.length > 0) {
    const preview = missing.slice(0, 10).join(", ");
    const suffix = missing.length > 10 ? ", …" : "";
    throw new Error(
      `Cannot finalize: ${track} is missing ${missing.length} fragment(s) (${preview}${suffix})`,
    );
  }

  const firstHeader = new Uint8Array(await files[0].slice(0, 8).arrayBuffer());
  const container = detectFmp4(firstHeader) ? "mp4" : "mpegts";
  const extension = container === "mp4" ? "mp4" : "ts";
  const mountPoint = `/inputs/${track}`;

  core.FS.mkdirTree(mountPoint);
  const blobs = files.map((file, index) => ({
    name: `${track}-${String(index).padStart(9, "0")}.${extension}`,
    data: file,
  }));
  core.FS.mount(core.FS.filesystems.WORKERFS, { blobs }, mountPoint);

  if (blobs.length === 1) {
    return {
      fileName: `${mountPoint}/${blobs[0].name}`,
      container,
      mountPoint,
    };
  }

  const listFileName = `/${track}.concat.txt`;
  const list = `${blobs
    .map((entry) => `${mountPoint}/${entry.name}`)
    .join("\n")}\n`;
  core.FS.writeFile(listFileName, new TextEncoder().encode(list));
  return {
    fileName: `concatf:${listFileName}`,
    container,
    mountPoint,
    listFileName,
  };
}

async function mux(request: DiskMuxRequest): Promise<void> {
  const {
    requestId,
    storageKey,
    videoLength,
    audioLength,
    subtitleText,
    subtitleLanguage,
    exportId,
  } = request;

  let accessHandle: FileSystemSyncAccessHandle | undefined;
  let core: FFmpegCore | undefined;
  let videoInput: MountedInput | undefined;
  let audioInput: MountedInput | undefined;

  try {
    core = await loadCore(request.coreURL, request.wasmURL, requestId);
    progress(requestId, 0.05, "Preparing disk-backed inputs");
    videoInput = await mountTrack(core, storageKey, "video", videoLength);
    audioInput = await mountTrack(core, storageKey, "audio", audioLength);

    if (subtitleText !== undefined) {
      core.FS.writeFile(
        "/subtitles.vtt",
        new TextEncoder().encode(subtitleText),
      );
    }

    const outputContainer =
      subtitleText !== undefined ? "mkv" : request.container;
    const outputFormat =
      outputContainer === "mkv" ? "matroska" : ("mp4" as const);
    const mime = outputContainer === "mkv" ? "video/x-matroska" : "video/mp4";

    const outputHandle = await getExportHandle(exportId, true);
    accessHandle = await outputHandle.createSyncAccessHandle();
    (accessHandle as any).truncate(0);
    registerSeekableOpfsOutputDevice(core, accessHandle);

    const args = buildMuxArgs({
      outputFileName: OPFS_OUTPUT_DEVICE_PATH,
      outputFormat,
      hasVideo: videoLength > 0,
      hasAudio: audioLength > 0,
      videoFileName: videoInput?.fileName,
      audioFileName: audioInput?.fileName,
      videoContainer: videoInput?.container,
      audioContainer: audioInput?.container,
      subtitleText,
      subtitleLanguage,
    });

    progress(requestId, 0.1, "Muxing");
    const exitCode = core.exec(...args);
    core.reset();
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}`);
    }

    await Promise.resolve((accessHandle as any).flush());
    await Promise.resolve((accessHandle as any).close());
    accessHandle = undefined;

    const outputFile = await outputHandle.getFile();
    if (outputFile.size === 0) {
      throw new Error("FFmpeg produced an empty output file");
    }

    progress(requestId, 1, "Ready to download");
    post({
      type: "success",
      requestId,
      exportId,
      mime,
      size: outputFile.size,
      wasmMemoryBytes: core.HEAPU8?.buffer?.byteLength ?? 0,
    });
  } catch (error) {
    try {
      await Promise.resolve((accessHandle as any)?.close?.());
    } catch (_closeError) {
      // Best effort.
    }
    await deleteExportFile(exportId).catch(() => undefined);
    post({
      type: "failure",
      requestId,
      message:
        (error as DOMException)?.name === "QuotaExceededError"
          ? "Not enough disk space to finalize this download"
          : error instanceof Error
            ? error.message
            : String(error),
    });
  } finally {
    if (core) {
      for (const input of [videoInput, audioInput]) {
        if (!input) continue;
        try {
          core.FS.unmount(input.mountPoint);
        } catch (_error) {
          // The worker is terminated after this request.
        }
      }
    }
  }
}

workerScope.onmessage = ({ data }: MessageEvent<DiskMuxRequest>) => {
  if (data?.type === "mux") {
    void mux(data);
  }
};
