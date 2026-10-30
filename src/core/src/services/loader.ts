export interface LoadedText {
  text: string;
  uri: string;
}

export interface ILoader {
  fetchTextResponse?(
    url: string,
    attempts?: number,
    signal?: AbortSignal,
  ): Promise<LoadedText>;
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
