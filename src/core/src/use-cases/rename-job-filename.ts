import type { OutputContainer } from "../entities/output-container";
import { buildFilename, containerFromFilename } from "./build-filename";

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
  return buildFilename(
    requestedName,
    container ?? containerFromFilename(currentFilename),
  );
}
