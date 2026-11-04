import filenamify from "filenamify/browser";
import type { OutputContainer } from "../entities/output-container";
import { sanitizeFilename } from "./sanitize-filename";

// Each UTF-16 code unit needs at most 3 UTF-8 bytes. Stay below 255 bytes.
export const MAX_FILENAME_LENGTH = 80;

export function containerFromFilename(filename: string): OutputContainer {
  return filename.toLowerCase().endsWith(".mkv") ? "mkv" : "mp4";
}

/**
 * The final filename rules: sanitizes the name, renames reserved names such
 * as CON, and shortens it to MAX_FILENAME_LENGTH with the extension kept.
 * Applying it to a name it already returned gives the same name, so the
 * save path can run it again without changing what core built.
 */
export function finalizeFilename(
  name: string,
  fallback = "stream.mp4",
): string {
  return filenamify(sanitizeFilename(name) || fallback, {
    maxLength: MAX_FILENAME_LENGTH,
  });
}

/**
 * Builds a filename from a base name and an extension. Creating, renaming
 * and saving all end in finalizeFilename, so they follow the same rules. A
 * repeated extension is dropped. Returns undefined when nothing usable is
 * left.
 */
export function buildFilename(
  name: string,
  extension: string,
): string | undefined {
  const withoutExtension = name
    .trim()
    .replace(new RegExp(`\\.${extension}$`, "i"), "");
  const baseName = sanitizeFilename(withoutExtension);
  if (!baseName) return undefined;
  return finalizeFilename(`${baseName}.${extension}`);
}
