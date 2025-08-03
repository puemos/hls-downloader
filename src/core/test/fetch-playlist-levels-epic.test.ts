import { describe, it, expect, vi } from 'vitest';
import { of, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { fetchPlaylistLevelsEpic } from '../src/controllers/fetch-playlist-levels-epic.ts';
import { playlistsSlice } from '../src/store/slices/index.ts';
import { levelsSlice } from '../src/store/slices/levels-slice.ts';
import { Playlist, Level } from '../src/entities/index.ts';

describe('fetchPlaylistLevelsEpic', () => {
  it('loads levels for playlist', async () => {
    const playlist = new Playlist('1', 'uri', Date.now());
    const level = new Level('stream', 'l', '1', 'lu');
    const loader = { fetchText: vi.fn().mockResolvedValue('') };
    const parser = { parseMasterPlaylist: vi.fn().mockReturnValue([level]) };
    const action$ = of(
      playlistsSlice.actions.fetchPlaylistLevels({ playlistID: '1' }),
    );
    const state = {
      playlists: { playlists: { '1': playlist } },
      config: { fetchAttempts: 1 },
    };
    const result = await firstValueFrom(
      fetchPlaylistLevelsEpic(action$, { value: state } as any, {
        loader,
        parser,
      } as any).pipe(toArray()),
    );
    expect(result).toEqual([
      playlistsSlice.actions.fetchPlaylistLevelsSuccess({ playlistID: '1' }),
      levelsSlice.actions.add({ levels: [level] }),
    ]);
  });
});

