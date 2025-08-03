import { describe, it, expect } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { createRootEpic } from '../src/controllers/root-epic.ts';
import { jobsSlice } from '../src/store/slices/index.ts';

describe('root epic', () => {
  it('runs child epics', async () => {
    const rootEpic = createRootEpic();
    const action$ = of(jobsSlice.actions.cancel({ jobId: '1' }));
    const result = await firstValueFrom(
      rootEpic(action$, { value: {} } as any, { fs: {} } as any),
    );
    expect(result).toEqual(jobsSlice.actions.delete({ jobId: '1' }));
  });
});

