// These functions are serialized into an isolated test extension's background
// context. They never modify the user's installed extension or browser profile.
export function installStorageFailure(context = globalThis) {
  const prototype = context.FileSystemDirectoryHandle.prototype;
  const original = prototype.getDirectoryHandle;
  context.__e2eStorageFaults = 0;
  prototype.getDirectoryHandle = function (name, options) {
    if (name === "video" && options?.create && !context.__e2eStorageFaults) {
      context.__e2eStorageFaults++;
      prototype.getDirectoryHandle = original;
      return Promise.reject(
        new context.DOMException(
          "Local test: storage temporarily unavailable",
          "UnknownError",
        ),
      );
    }
    return original.call(this, name, options);
  };
  return true;
}

export async function jobDirectories(context = globalThis) {
  try {
    const root = await context.navigator.storage.getDirectory();
    const app = await root.getDirectoryHandle("hls-downloader");
    const version = await app.getDirectoryHandle("v1");
    const jobs = await version.getDirectoryHandle("jobs");
    const entries = [];
    for await (const [name] of jobs.entries()) entries.push(name);
    return entries;
  } catch (error) {
    if (error.name === "NotFoundError") return [];
    throw error;
  }
}
