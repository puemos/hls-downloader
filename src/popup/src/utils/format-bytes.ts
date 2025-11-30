export function formatBytes(
  bytes?: number,
  options: { precision?: number; fallback?: string } = {}
): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return options.fallback ?? "—";
  }

  const absolute = Math.max(0, bytes);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = absolute;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  const precision =
    options.precision !== undefined
      ? options.precision
      : unitIndex === 0
      ? 0
      : 1;

  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0,
  });

  return `${formatter.format(value)} ${units[unitIndex]}`;
}
