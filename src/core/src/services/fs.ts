export interface IFS {
  cleanup(): Promise<void>;
  getBucket(id: string): Promise<Bucket>;
  createBucket(id: string, videoLength: number, audioLength: number): Promise<void>;
  deleteBucket(id: string): Promise<void>;
  saveAs(
    path: string,
    link: string,
    options: {
      dialog: boolean;
    },
  ): Promise<void>;
}

export interface Bucket {
  write(index: number, data: ArrayBuffer): Promise<void>;
  getLink(
    onProgress?: (progress: number, message: string) => void,
  ): Promise<string>;
}
