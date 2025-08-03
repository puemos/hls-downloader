import { describe, it, expect, vi } from 'vitest';
import {
  createBucketFactory,
  deleteBucketFactory,
  writeToBucketFactory,
  saveAsFactory,
  fsCleanupFactory,
  getLinkBucketFactory,
  generateFileName,
  decryptSingleFragmentFactory,
} from '../src/use-cases/index.ts';
import { Playlist, Level, Key } from '../src/entities/index.ts';
import type { IFS, Bucket, ILoader, IDecryptor } from '../src/services/index.ts';

const createFsMock = () => {
  const bucket: Bucket = {
    write: vi.fn().mockResolvedValue(undefined),
    getLink: vi.fn().mockResolvedValue('link'),
  };

  const fs: IFS = {
    cleanup: vi.fn().mockResolvedValue(undefined),
    createBucket: vi.fn().mockResolvedValue(undefined),
    deleteBucket: vi.fn().mockResolvedValue(undefined),
    getBucket: vi.fn().mockResolvedValue(bucket),
    saveAs: vi.fn().mockResolvedValue(undefined),
  };
  return { fs, bucket };
};

describe('use-cases', () => {
  it('creates bucket', async () => {
    const { fs } = createFsMock();
    await createBucketFactory(fs)('id', 1, 2);
    expect(fs.createBucket).toHaveBeenCalledWith('id', 1, 2);
  });

  it('deletes bucket', async () => {
    const { fs } = createFsMock();
    await deleteBucketFactory(fs)('id');
    expect(fs.deleteBucket).toHaveBeenCalledWith('id');
  });

  it('writes to bucket', async () => {
    const { fs, bucket } = createFsMock();
    await writeToBucketFactory(fs)('id', 1, new ArrayBuffer(1));
    expect(fs.getBucket).toHaveBeenCalledWith('id');
    expect(bucket.write).toHaveBeenCalled();
  });

  it('saves to file', async () => {
    const { fs } = createFsMock();
    await saveAsFactory(fs)('p', 'l', { dialog: true });
    expect(fs.saveAs).toHaveBeenCalledWith('p', 'l', { dialog: true });
  });

  it('cleans up fs', async () => {
    const { fs } = createFsMock();
    await fsCleanupFactory(fs)();
    expect(fs.cleanup).toHaveBeenCalled();
  });

  it('gets link from bucket', async () => {
    const { fs, bucket } = createFsMock();
    const link = await getLinkBucketFactory(fs)('id');
    expect(fs.getBucket).toHaveBeenCalledWith('id');
    expect(bucket.getLink).toHaveBeenCalled();
    expect(link).toBe('link');
  });

  it('generates file name with page title', () => {
    const playlist = new Playlist('1', 'https://a/b/c.m3u8', Date.now(), 'page');
    const level = new Level('stream', 'l', '1', 'uri');
    const run = generateFileName();
    expect(run(playlist, level)).toBe('page-c.mp4');
  });

  it('decrypts fragment when key available', async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    };
    const decryptor: IDecryptor = {
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
    };
    const run = decryptSingleFragmentFactory(loader, decryptor);
    const key = new Key('https://key', new Uint8Array([1]));
    const data = new ArrayBuffer(2);
    const result = await run(key, data, 2);
    expect(loader.fetchArrayBuffer).toHaveBeenCalledWith('https://key', 2);
    expect(decryptor.decrypt).toHaveBeenCalled();
    expect(result.byteLength).toBe(4);
  });

  it('returns original data if key missing', async () => {
    const loader: ILoader = {
      fetchText: vi.fn(),
      fetchArrayBuffer: vi.fn(),
    };
    const decryptor: IDecryptor = {
      decrypt: vi.fn(),
    };
    const run = decryptSingleFragmentFactory(loader, decryptor);
    const key = new Key(null, null);
    const data = new ArrayBuffer(2);
    const result = await run(key, data, 2);
    expect(result).toBe(data);
    expect(loader.fetchArrayBuffer).not.toHaveBeenCalled();
    expect(decryptor.decrypt).not.toHaveBeenCalled();
  });
});
