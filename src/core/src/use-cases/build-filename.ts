import type { OutputContainer } from "../entities/output-container";
import { sanitizeFilename } from "./sanitize-filename";

// Each UTF-16 code unit needs at most 3 UTF-8 bytes. Stay below 255 bytes.
export const MAX_FILENAME_LENGTH = 80;

export function containerFromFilename(filename: string): OutputContainer {
  return filename.toLowerCase().endsWith(".mkv") ? "mkv" : "mp4";
}

/**
 * Builds a filename from a base name and an extension. Every filename the
 * extension creates, renames or saves goes through here, so they all follow
 * the same rules: the name is sanitized, a repeated extension is dropped, and
 * the base is shortened so the whole name fits MAX_FILENAME_LENGTH with the
 * extension intact. Returns undefined when nothing usable is left.
 */
export function buildFilename(
  name: string,
  extension: string,
): string | undefined {
  const withoutExtension = name
    .trim()
    .replace(new RegExp(`\\.${extension}$`, "i"), "");
  const baseName = truncate(
    sanitizeFilename(withoutExtension),
    MAX_FILENAME_LENGTH - extension.length - 1,
  );
  if (!baseName) return undefined;
  return `${baseName}.${extension}`.normalize("NFC");
}

let segmenter: Intl.Segmenter | undefined;

// Cut on grapheme boundaries so emoji and combined characters stay whole.
function truncate(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });
  let truncated = "";
  for (const { segment } of segmenter.segment(name)) {
    if (truncated.length + segment.length > maxLength) break;
    truncated += segment;
  }
  return truncated.replace(/[\s.~]+$/, "");
}
