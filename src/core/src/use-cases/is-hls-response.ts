const HLS_TYPES = new Set([
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/mpegurl",
  "audio/x-mpegurl",
]);

export function isHlsResponse(uri: string, contentType: string): boolean {
  try {
    const url = new URL(uri);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const mime = contentType.split(";")[0].trim().toLowerCase();
    // RFC 8216 section 4: either the filename or the MIME type identifies HLS.
    return HLS_TYPES.has(mime) || /\.m3u8?$/i.test(url.pathname);
  } catch {
    return false;
  }
}
