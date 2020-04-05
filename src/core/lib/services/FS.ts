export interface IFS {
  bucket(base: string): IBucket;
}

export interface IBucket {
  write(path: string, data: ArrayBuffer): Promise<void>;
  read(path: string): Promise<ArrayBuffer>;
}
