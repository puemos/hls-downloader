export interface FS {
  bucket(base: string): Bucket;
}

export interface Bucket {
  write(path: string, data: ArrayBuffer): Promise<void>;
  read(path: string): Promise<ArrayBuffer>;
}
