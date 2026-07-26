export const OPFS_BACKEND = "opfs-v1" as const;
export const LEGACY_BACKEND = "indexeddb-v1" as const;

export type BucketBackend = typeof OPFS_BACKEND | typeof LEGACY_BACKEND;
export type MediaTrack = "video" | "audio";

const ROOT_DIRECTORY = "hls-downloader";
const VERSION_DIRECTORY = "v1";
const JOBS_DIRECTORY = "jobs";
const EXPORTS_DIRECTORY = "exports";

export function fragmentFileName(index: number): string {
  return `${String(index).padStart(9, "0")}.part`;
}

function getStorageManager(): StorageManager {
  const storage = globalThis.navigator?.storage;
  if (!storage?.getDirectory) {
    throw new Error(
      "This browser cannot use disk-backed downloads. Upgrade to Firefox 115 or Chromium 109.",
    );
  }
  return storage;
}

export async function getVersionDirectory(): Promise<FileSystemDirectoryHandle> {
  const root = await getStorageManager().getDirectory();
  const app = await root.getDirectoryHandle(ROOT_DIRECTORY, { create: true });
  return await app.getDirectoryHandle(VERSION_DIRECTORY, { create: true });
}

export async function getJobsDirectory(
  create = true,
): Promise<FileSystemDirectoryHandle> {
  const version = await getVersionDirectory();
  return await version.getDirectoryHandle(JOBS_DIRECTORY, { create });
}

export async function getExportsDirectory(
  create = true,
): Promise<FileSystemDirectoryHandle> {
  const version = await getVersionDirectory();
  return await version.getDirectoryHandle(EXPORTS_DIRECTORY, { create });
}

export async function getJobDirectory(
  storageKey: string,
  create = true,
): Promise<FileSystemDirectoryHandle> {
  const jobs = await getJobsDirectory(create);
  return await jobs.getDirectoryHandle(storageKey, { create });
}

export async function getTrackDirectory(
  storageKey: string,
  track: MediaTrack,
  create = true,
): Promise<FileSystemDirectoryHandle> {
  const job = await getJobDirectory(storageKey, create);
  return await job.getDirectoryHandle(track, { create });
}

export async function initializeJobStorage(storageKey: string): Promise<void> {
  await Promise.all([
    getTrackDirectory(storageKey, "video", true),
    getTrackDirectory(storageKey, "audio", true),
  ]);
}

async function getExistingFileSize(
  directory: FileSystemDirectoryHandle,
  name: string,
): Promise<number | undefined> {
  try {
    const handle = await directory.getFileHandle(name);
    return (await handle.getFile()).size;
  } catch (error) {
    if ((error as DOMException)?.name === "NotFoundError") {
      return undefined;
    }
    throw error;
  }
}

export async function writeFragmentFile(
  storageKey: string,
  track: MediaTrack,
  index: number,
  data: ArrayBuffer,
): Promise<{ previousSize?: number; size: number }> {
  const directory = await getTrackDirectory(storageKey, track, true);
  const name = fragmentFileName(index);
  const previousSize = await getExistingFileSize(directory, name);
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();

  try {
    await writable.write(new Uint8Array(data));
    await writable.close();
  } catch (error) {
    try {
      await writable.abort(error);
    } catch (_abortError) {
      // Best effort. The browser discards the temporary write on failure.
    }
    throw error;
  }

  return { previousSize, size: data.byteLength };
}

export async function getFragmentFile(
  storageKey: string,
  track: MediaTrack,
  index: number,
): Promise<File> {
  const directory = await getTrackDirectory(storageKey, track, false);
  const handle = await directory.getFileHandle(fragmentFileName(index));
  return await handle.getFile();
}

export async function deleteJobStorage(storageKey: string): Promise<void> {
  try {
    const jobs = await getJobsDirectory(false);
    await jobs.removeEntry(storageKey, { recursive: true });
  } catch (error) {
    if ((error as DOMException)?.name !== "NotFoundError") {
      throw error;
    }
  }
}

export async function measureJobStorage(
  storageKey: string,
): Promise<{ storedBytes: number; storedChunks: number }> {
  let storedBytes = 0;
  let storedChunks = 0;

  for (const track of ["video", "audio"] as const) {
    try {
      const directory = await getTrackDirectory(storageKey, track, false);
      for await (const [_name, handle] of (directory as any).entries()) {
        if (handle.kind !== "file") continue;
        const file = await (handle as FileSystemFileHandle).getFile();
        storedBytes += file.size;
        storedChunks++;
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "NotFoundError") {
        throw error;
      }
    }
  }

  return { storedBytes, storedChunks };
}

export async function clearAllJobStorage(): Promise<void> {
  try {
    const version = await getVersionDirectory();
    await version.removeEntry(JOBS_DIRECTORY, { recursive: true });
  } catch (error) {
    if ((error as DOMException)?.name !== "NotFoundError") {
      throw error;
    }
  }
}

export async function getExportHandle(
  exportId: string,
  create = false,
): Promise<FileSystemFileHandle> {
  const exportsDirectory = await getExportsDirectory(create);
  return await exportsDirectory.getFileHandle(exportId, { create });
}

export async function getExportFile(exportId: string): Promise<File> {
  const handle = await getExportHandle(exportId, false);
  return await handle.getFile();
}

export async function deleteExportFile(exportId: string): Promise<void> {
  try {
    const exportsDirectory = await getExportsDirectory(false);
    await exportsDirectory.removeEntry(exportId);
  } catch (error) {
    if ((error as DOMException)?.name !== "NotFoundError") {
      throw error;
    }
  }
}

export async function listExportIds(): Promise<string[]> {
  try {
    const exportsDirectory = await getExportsDirectory(false);
    const ids: string[] = [];
    for await (const [name, handle] of (exportsDirectory as any).entries()) {
      if (handle.kind === "file") {
        ids.push(name);
      }
    }
    return ids;
  } catch (error) {
    if ((error as DOMException)?.name === "NotFoundError") {
      return [];
    }
    throw error;
  }
}
