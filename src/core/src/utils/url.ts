export function appendQueryParams(
  sourceUrl: string,
  targetUrl: string
): string {
  try {
    const source = new URL(sourceUrl, targetUrl);
    const target = new URL(targetUrl, source);

    if (!source.search || source.search === "?") {
      return target.toString();
    }

    const sourceParams = new URLSearchParams(source.search);
    const targetParams = new URLSearchParams(target.search);
    let changed = false;

    sourceParams.forEach((value, key) => {
      if (!targetParams.has(key)) {
        targetParams.append(key, value);
        changed = true;
      }
    });

    if (!changed) {
      return target.toString();
    }

    target.search = targetParams.toString();
    return target.toString();
  } catch (_e) {
    return targetUrl;
  }
}
