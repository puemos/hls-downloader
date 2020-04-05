export interface Loader {
  fetchText(url: string): Promise<string>;
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
}
