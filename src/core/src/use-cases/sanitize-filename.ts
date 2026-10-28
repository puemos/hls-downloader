export function sanitizeFilename(name: string): string {
  return (
    name
      .normalize("NFC")
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      // Browser downloads reject format characters, including emoji zero-width joiners.
      .replace(/[\p{Cc}\p{Cf}\p{Noncharacter_Code_Point}]/gu, "")
      .replace(/^[\s.~]+|[\s.~]+$/g, "")
  );
}
