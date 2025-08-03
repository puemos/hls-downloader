import { describe, it, expect } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { cancelJobdeleteJobEpic } from '../src/controllers/cancel-job-delete-job-epic.ts';
import { jobsSlice } from '../src/store/slices/index.ts';

describe('cancelJobdeleteJobEpic', () => {
  it('dispatches delete when job is canceled', async () => {
    const action$ = of(jobsSlice.actions.cancel({ jobId: '1' }));
    const result = await firstValueFrom(
      cancelJobdeleteJobEpic(action$, {} as any, { fs: {} } as any),
    );
    expect(result).toEqual(jobsSlice.actions.delete({ jobId: '1' }));
  });
});

