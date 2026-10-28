// Firefox rejects a download filename if its own sanitizer would change it
// ("filename must not contain illegal characters"), so the result has to be
// something that sanitizer leaves alone, not just free of reserved punctuation.
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/[\s﻿]+/g, " ")
    .replace(/\p{Cc}/gu, "")
    // Invisible formatting characters, e.g. the zero-width joiner in emoji
    // sequences like 🏳️‍⚧️.
    .replace(/\p{Cf}/gu, "_")
    .replace(/^[\s.]+/, "")
    .trim();
}
