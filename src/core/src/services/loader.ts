export interface ILoader {
  fetchText(url: string): Promise<string>;
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
  tryFetchArrayBuffer(url: string, attempts: number): Promise<ArrayBuffer>;
  tryFetchText(url: string, attempts: number): Promise<string>;
}
