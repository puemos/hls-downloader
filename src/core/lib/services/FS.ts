export interface IFS {
  write(path: string, data: ArrayBuffer): Promise<void>;
  read(path: string): Promise<ArrayBuffer>;
}
