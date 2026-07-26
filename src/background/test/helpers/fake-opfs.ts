type FakeOpfsOptions = {
  quota?: number;
  usage?: number;
};

function notFound(name: string): DOMException {
  return new DOMException(`${name} was not found`, "NotFoundError");
}

async function toBytes(data: unknown): Promise<Uint8Array> {
  if (data instanceof Uint8Array) {
    return new Uint8Array(data);
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data.slice(0));
  }
  if (data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }
  throw new TypeError("Unsupported fake OPFS write");
}

export class FakeFileHandle {
  readonly kind = "file";
  private bytes = new Uint8Array();
  nextWriteError?: Error;

  constructor(readonly name: string) {}

  async getFile(): Promise<File> {
    return new File([this.bytes.slice().buffer], this.name);
  }

  async createWritable(): Promise<{
    write(data: unknown): Promise<void>;
    close(): Promise<void>;
    abort(): Promise<void>;
  }> {
    let pending = new Uint8Array();
    let aborted = false;
    return {
      write: async (data: unknown) => {
        if (this.nextWriteError) {
          const error = this.nextWriteError;
          this.nextWriteError = undefined;
          throw error;
        }
        pending = await toBytes(data);
      },
      close: async () => {
        if (!aborted) {
          this.bytes = pending;
        }
      },
      abort: async () => {
        aborted = true;
      },
    };
  }

  async createSyncAccessHandle(): Promise<{
    read(buffer: ArrayBufferView, options?: { at?: number }): number;
    write(buffer: ArrayBufferView, options?: { at?: number }): number;
    truncate(size: number): void;
    getSize(): number;
    flush(): void;
    close(): void;
  }> {
    return {
      read: (buffer, options) => {
        const target = new Uint8Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength,
        );
        const at = options?.at ?? 0;
        const source = this.bytes.subarray(at, at + target.byteLength);
        target.set(source);
        return source.byteLength;
      },
      write: (buffer, options) => {
        const source = new Uint8Array(
          buffer.buffer,
          buffer.byteOffset,
          buffer.byteLength,
        );
        const at = options?.at ?? 0;
        const size = Math.max(this.bytes.byteLength, at + source.byteLength);
        const next = new Uint8Array(size);
        next.set(this.bytes);
        next.set(source, at);
        this.bytes = next;
        return source.byteLength;
      },
      truncate: (size) => {
        const next = new Uint8Array(size);
        next.set(this.bytes.subarray(0, size));
        this.bytes = next;
      },
      getSize: () => this.bytes.byteLength,
      flush: () => undefined,
      close: () => undefined,
    };
  }
}

export class FakeDirectoryHandle {
  readonly kind = "directory";
  private readonly entriesByName = new Map<
    string,
    FakeDirectoryHandle | FakeFileHandle
  >();

  constructor(readonly name = "") {}

  async getDirectoryHandle(
    name: string,
    options: { create?: boolean } = {},
  ): Promise<FakeDirectoryHandle> {
    const existing = this.entriesByName.get(name);
    if (existing instanceof FakeDirectoryHandle) {
      return existing;
    }
    if (existing || !options.create) {
      throw notFound(name);
    }
    const directory = new FakeDirectoryHandle(name);
    this.entriesByName.set(name, directory);
    return directory;
  }

  async getFileHandle(
    name: string,
    options: { create?: boolean } = {},
  ): Promise<FakeFileHandle> {
    const existing = this.entriesByName.get(name);
    if (existing instanceof FakeFileHandle) {
      return existing;
    }
    if (existing || !options.create) {
      throw notFound(name);
    }
    const file = new FakeFileHandle(name);
    this.entriesByName.set(name, file);
    return file;
  }

  async removeEntry(
    name: string,
    options: { recursive?: boolean } = {},
  ): Promise<void> {
    const existing = this.entriesByName.get(name);
    if (!existing) {
      throw notFound(name);
    }
    if (
      existing instanceof FakeDirectoryHandle &&
      existing.entriesByName.size > 0 &&
      !options.recursive
    ) {
      throw new DOMException(
        "Directory is not empty",
        "InvalidModificationError",
      );
    }
    this.entriesByName.delete(name);
  }

  async *entries(): AsyncGenerator<
    [string, FakeDirectoryHandle | FakeFileHandle]
  > {
    yield* this.entriesByName.entries();
  }
}

export function createFakeOpfs(options: FakeOpfsOptions = {}) {
  const root = new FakeDirectoryHandle();
  const storage = {
    getDirectory: async () => root,
    estimate: async () => ({
      usage: options.usage ?? 0,
      quota: options.quota ?? 16 * 1024 * 1024 * 1024,
    }),
  };
  return { root, storage };
}
