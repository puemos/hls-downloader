import 'fake-indexeddb/auto';
import { vi, describe, it, expect } from 'vitest';
vi.mock('webextension-polyfill', () => ({ downloads: { download: vi.fn() } }));
import { IndexedDBFS } from '../src/services/indexedb-fs';

const streamToArray = async (stream: ReadableStream<Uint8Array>) => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return chunks;
};

describe('IndexedDBFS', () => {
  it('writes and reads data through a bucket stream and deletes the bucket', async () => {
    const id = 'bucket1';
    await IndexedDBFS.createBucket(id, 0, 0);
    const bucket = await IndexedDBFS.getBucket(id);
    expect(bucket).toBeDefined();

    await bucket!.write(0, new Uint8Array([1, 2]).buffer);
    await bucket!.write(1, new Uint8Array([3, 4]).buffer);

    const chunks = await streamToArray(await bucket!.stream());
    expect(chunks).toHaveLength(2);
    expect(Array.from(chunks[0])).toEqual([1, 2]);
    expect(Array.from(chunks[1])).toEqual([3, 4]);

    await IndexedDBFS.deleteBucket(id);
    expect(await IndexedDBFS.getBucket(id)).toBeUndefined();
  });
});
