import { describe, it, expect, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { addDownloadJobEpic } from '../src/controllers/add-download-job-epic.ts';
import { levelsSlice } from '../src/store/slices/levels-slice.ts';
import { jobsSlice } from '../src/store/slices/index.ts';
import { Playlist, Level, Fragment, Key } from '../src/entities/index.ts';

describe('addDownloadJobEpic', () => {
  it('creates a download job for selected levels', async () => {
    const videoLevel = new Level('stream', 'v', 'p', 'video', 1920, 1080, 1000);
    const audioLevel = new Level('audio', 'a', 'p', 'audio');
    const playlist = new Playlist('p', 'http://example.com/master.m3u8', Date.now(), 'page');
    const videoFragment = new Fragment(new Key(null, null), 'vf', 0);
    const audioFragment = new Fragment(new Key(null, null), 'af', 0);

    const loader = { fetchText: vi.fn().mockResolvedValue('') };
    const parser = {
      parseLevelPlaylist: vi
        .fn()
        .mockImplementation((_text, uri) =>
          uri === 'video' ? [videoFragment] : [audioFragment],
        ),
    };
    const deps = { loader, parser };

    const action$ = of(
      levelsSlice.actions.download({ levelID: 'v', audioLevelID: 'a' }),
    );
    const state = {
      levels: { levels: { v: videoLevel, a: audioLevel } },
      playlists: { playlists: { p: playlist } },
      config: { fetchAttempts: 1, concurrency: 2, saveDialog: false },
      tabs: { current: { id: -1 } },
      jobs: { jobs: {}, jobsStatus: {} },
    };

    const result = await firstValueFrom(
      addDownloadJobEpic(action$, { value: state } as any, deps as any),
    );

    expect(result.type).toBe(jobsSlice.actions.add.type);
    expect(result.payload.job.filename).toBe('page-master.mp4');
    expect(result.payload.job.videoFragments).toEqual([videoFragment]);
    expect(result.payload.job.audioFragments).toEqual([audioFragment]);
    expect(result.payload.job.bitrate).toBe(1000);
    expect(result.payload.job.width).toBe(1920);
    expect(result.payload.job.height).toBe(1080);
    expect(result.payload.job.id).toMatch(/^page-master.mp4\//);
  });
});

