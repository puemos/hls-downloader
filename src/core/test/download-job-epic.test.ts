import { describe, it, expect, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { downloadJobEpic } from '../src/controllers/download-job-epic.ts';
import { jobsSlice } from '../src/store/slices/index.ts';
import { Fragment, Key } from '../src/entities/index.ts';

describe('downloadJobEpic', () => {
  it('downloads fragments and reports progress', async () => {
    const fragment = new Fragment(new Key(null, null), 'f', 0);
    const job = {
      id: '1',
      videoFragments: [fragment],
      audioFragments: [],
      filename: 'file.mp4',
      createdAt: Date.now(),
      bitrate: 1000,
      width: 640,
      height: 360,
    };
    const fs = {
      createBucket: vi.fn().mockResolvedValue(undefined),
      getBucket: vi.fn().mockResolvedValue({
        write: vi.fn().mockResolvedValue(undefined),
      }),
    };
    const loader = {
      fetchArrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    };
    const decryptor = { decrypt: vi.fn() };
    const action$ = of(jobsSlice.actions.add({ job }));
    const state = { config: { concurrency: 1, fetchAttempts: 1 } };
    const result = await firstValueFrom(
      downloadJobEpic(action$, { value: state } as any, {
        fs,
        loader,
        decryptor,
      } as any),
    );
    expect(fs.createBucket).toHaveBeenCalledWith('1', 1, 0);
    expect(result).toEqual(
      jobsSlice.actions.incDownloadStatus({ jobId: '1' }),
    );
  });
});

