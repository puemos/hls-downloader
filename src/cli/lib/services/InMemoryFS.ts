export function bucket(path: string) {
  return new Bucket(path);
}

export class Bucket {
  private store: Record<string, ArrayBuffer> = {};
  constructor(readonly path: string) {}
  write(path: string, data: ArrayBuffer): Promise<void> {
    this.store[path] = data;
    return Promise.resolve();
  }
  read(path: string): Promise<ArrayBuffer> {
    return Promise.resolve(this.store[path]);
  }
}

export const InMemoryFS = {
  bucket,
};
