type Fetcher<T> = (uri: string, attempts: number) => Promise<T>;

export async function fetchWithFallback<T>(
  primaryUri: string,
  fallbackUri: string | null | undefined,
  attempts: number,
  fetcher: Fetcher<T>
): Promise<{ uri: string; data: T }> {
  try {
    const data = await fetcher(primaryUri, attempts);
    return { uri: primaryUri, data };
  } catch (error) {
    if (fallbackUri && fallbackUri !== primaryUri) {
      const data = await fetcher(fallbackUri, attempts);
      return { uri: fallbackUri, data };
    }
    throw error;
  }
}
