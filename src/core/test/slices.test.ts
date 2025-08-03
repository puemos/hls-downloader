import { describe, it, expect } from 'vitest';
import { configSlice, jobsSlice, levelsSlice, playlistsSlice, tabsSlice } from '../src/store/slices/index.ts';
import { Level, Fragment, Key, Job, Playlist } from '../src/entities/index.ts';

describe('store slices', () => {
  it('config slice reducers', () => {
    let state = configSlice.reducer(undefined, { type: 'init' } as any);
    state = configSlice.reducer(state, configSlice.actions.setConcurrency({ concurrency: 5 }));
    expect(state.concurrency).toBe(5);
    state = configSlice.reducer(state, configSlice.actions.setSaveDialog({ saveDialog: true }));
    expect(state.saveDialog).toBe(true);
    state = configSlice.reducer(state, configSlice.actions.setFetchAttempts({ fetchAttempts: 10 }));
    expect(state.fetchAttempts).toBe(10);
  });

  it('jobs slice reducers', () => {
    const fragment = new Fragment(new Key(null, null), 'u', 0);
    const job = new Job('1', [fragment], [], 'f', Date.now());
    let state = jobsSlice.reducer(undefined, { type: 'init' } as any);
    state = jobsSlice.reducer(state, jobsSlice.actions.add({ job }));
    expect(state.jobs['1']).toBe(job);
    expect(state.jobsStatus['1']!.total).toBe(1);
    state = jobsSlice.reducer(state, jobsSlice.actions.incDownloadStatus({ jobId: '1' }));
    expect(state.jobsStatus['1']!.done).toBe(1);
    state = jobsSlice.reducer(state, jobsSlice.actions.saveAs({ jobId: '1' }));
    expect(state.jobsStatus['1']!.status).toBe('saving');
    state = jobsSlice.reducer(state, jobsSlice.actions.saveAsSuccess({ jobId: '1', link: 'l' }));
    expect(state.jobs['1']!.link).toBe('l');
    expect(state.jobsStatus['1']!.status).toBe('done');
    state = jobsSlice.reducer(state, jobsSlice.actions.setSaveProgress({ jobId: '1', progress: 50, message: 'm' }));
    expect(state.jobsStatus['1']!.saveProgress).toBe(50);
    expect(state.jobsStatus['1']!.saveMessage).toBe('m');
    state = jobsSlice.reducer(state, jobsSlice.actions.deleteSuccess({ jobId: '1' }));
    expect(state.jobs['1']).toBeUndefined();
    expect(state.jobsStatus['1']).toBeUndefined();
  });

  it('levels slice reducers', () => {
    const level1 = new Level('stream', 'l1', 'p', 'u1');
    const level2 = new Level('stream', 'l2', 'p', 'u2');
    let state = levelsSlice.reducer(undefined, { type: 'init' } as any);
    state = levelsSlice.reducer(state, levelsSlice.actions.add({ levels: [level1, level2] }));
    expect(state.levels['l1']).toBe(level1);
    state = levelsSlice.reducer(state, levelsSlice.actions.removePlaylistLevels({ playlistID: 'p' }));
    expect(state.levels['l1']).toBeUndefined();
  });

  it('playlists slice reducers', () => {
    const playlist = new Playlist('p1', 'uri', Date.now());
    let state = playlistsSlice.reducer(undefined, { type: 'init' } as any);
    state = playlistsSlice.reducer(state, playlistsSlice.actions.addPlaylist(playlist));
    expect(state.playlists['p1']).toBe(playlist);
    expect(state.playlistsStatus['p1']!.status).toBe('init');
    state = playlistsSlice.reducer(state, playlistsSlice.actions.fetchPlaylistLevels({ playlistID: 'p1' }));
    expect(state.playlistsStatus['p1']!.status).toBe('fetching');
    state = playlistsSlice.reducer(state, playlistsSlice.actions.fetchPlaylistLevelsSuccess({ playlistID: 'p1' }));
    expect(state.playlistsStatus['p1']!.status).toBe('ready');
    state = playlistsSlice.reducer(state, playlistsSlice.actions.removePlaylist({ playlistID: 'p1' }));
    expect(state.playlists['p1']).toBeUndefined();
  });

  it('tabs slice reducer', () => {
    let state = tabsSlice.reducer(undefined, { type: 'init' } as any);
    state = tabsSlice.reducer(state, tabsSlice.actions.setTab({ tab: { id: 5 } }));
    expect(state.current.id).toBe(5);
  });
});

