export function sanitizeFilename(name: string): string {
  return (
    name
      .normalize("NFC")
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      // Browser downloads reject format characters, including emoji zero-width joiners.
      .replace(/[\p{Cc}\p{Cf}\p{Noncharacter_Code_Point}]/gu, "")
      // Removing those can leave two spaces next to each other.
      .replace(/ {2,}/g, " ")
      .replace(/^[\s.~]+|[\s.~]+$/g, "")
  );
}
