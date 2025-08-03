import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { fsCleanupOnInitEpic } from '../src/controllers/on-init.ts';
import type { IFS } from '../src/services';

describe('fsCleanupOnInitEpic', () => {
  it('cleans fs on init and emits done action', async () => {
    const fs: IFS = {
      cleanup: vi.fn().mockResolvedValue(undefined),
      getBucket: vi.fn(),
      createBucket: vi.fn(),
      deleteBucket: vi.fn(),
      saveAs: vi.fn(),
    };
    const action$ = of({ type: 'init/start' });
    const result = await firstValueFrom(
      fsCleanupOnInitEpic(action$, null as any, { fs }),
    );
    expect(fs.cleanup).toHaveBeenCalled();
    expect(result.type).toBe('init/done');
  });
});
