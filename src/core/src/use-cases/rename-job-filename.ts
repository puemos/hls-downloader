import type { OutputContainer } from "../entities/output-container";
import { sanitizeFilename } from "./sanitize-filename";

/**
 * Builds the filename for a user-chosen job name. The container extension
 * is kept, since it decides how the job is muxed on save. Returns undefined
 * when nothing usable is left after sanitizing.
 */
export function renameJobFilename(
  currentFilename: string,
  requestedName: string,
  container?: OutputContainer,
): string | undefined {
  const extension =
    container ??
    (currentFilename.toLowerCase().endsWith(".mkv") ? "mkv" : "mp4");
  const withoutExtension = requestedName
    .trim()
    .replace(new RegExp(`\\.${extension}$`, "i"), "");
  const baseName = sanitizeFilename(withoutExtension);
  if (!baseName) return undefined;
  return `${baseName}.${extension}`.normalize("NFC");
}
