export interface IFS {
  getBucket(id: string): Bucket;
  createBucket(id: string, length: number): void;
  write(
    path: string,
    data: ArrayBuffer,
    options: {
      dialog: boolean;
    }
  ): Promise<void>;
}

export interface Bucket {
  write(index: number, data: ArrayBuffer): Promise<void>;
  merge(): Promise<ArrayBuffer>;
}
