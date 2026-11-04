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
  const filename = fit(sanitizeFilename(name) || fallback);
  const trimmed = trimBaseName(filename);
  // Trimming can leave a reserved name such as "CON.mp4", so check again.
  return trimmed === filename ? filename : fit(trimmed);
}

// filenamify adds "!" to reserved names after shortening, which can take
// the name past maxLength ("aux!.vtt…"). Shorten it that much more.
function fit(name: string): string {
  const filename = filenamify(name, { maxLength: MAX_FILENAME_LENGTH });
  const over = filename.length - MAX_FILENAME_LENGTH;
  return over > 0
    ? filenamify(name, { maxLength: MAX_FILENAME_LENGTH - over })
    : filename;
}

/**
 * filenamify can cut the base right after a dot or a copy of the extension
 * ("name ..mp4", "name.mp4.mp4"). The rename field shows the name without
 * its extension, and building it again drops those, so saving it unchanged
 * would give a different name. Drop them here instead.
 */
function trimBaseName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return filename;
  const extension = filename.slice(dot);
  let base = filename.slice(0, dot);
  let previous;
  do {
    previous = base;
    base = base.replace(/[\s.~]+$/, "");
    if (base.toLowerCase().endsWith(extension.toLowerCase())) {
      base = base.slice(0, -extension.length);
    }
  } while (base !== previous);
  return base ? base + extension : filename;
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
