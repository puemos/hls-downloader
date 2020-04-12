export interface ILoader {
  fetchText(url: string): Promise<string>;
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
}
