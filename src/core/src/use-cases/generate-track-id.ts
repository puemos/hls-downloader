export function generateTrackId(
  playlistId: string,
  type: "audio" | "subtitle" | "closed-caption",
  groupId: string,
  name: string,
): string {
  // Keep identity stable without allowing separators in names or URLs to collide.
  return JSON.stringify([playlistId, type, groupId, name]);
}
