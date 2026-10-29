export interface ILoader {
  fetchText(
    url: string,
    attempts?: number,
    signal?: AbortSignal,
  ): Promise<string>;
  fetchArrayBuffer(
    url: string,
    attempts?: number,
    byteRange?: { offset: number; length: number } | null,
    signal?: AbortSignal,
  ): Promise<ArrayBuffer>;
}
