export interface ILoader {
  fetchText(url: string, attempts?: number): Promise<string>;
  fetchArrayBuffer(url: string, attempts?: number): Promise<ArrayBuffer>;
}
