import { describe, it, expect } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { addPlaylistEpic } from "../src/controllers/add-playlist-epic.ts";
import { playlistsSlice } from "../src/store/slices/index.ts";
import { Playlist } from "../src/entities/index.ts";

describe("addPlaylistEpic", () => {
  it("fetches playlist levels when playlist exists", async () => {
    const playlist = new Playlist("1", "uri", Date.now());
    const action$ = of(playlistsSlice.actions.addPlaylist(playlist));
    const state = {
      playlists: {
        playlists: { "1": playlist },
        playlistsStatus: {},
      },
      levels: { levels: {} },
      config: { concurrency: 2, saveDialog: false, fetchAttempts: 1 },
      tabs: { current: { id: -1 } },
      jobs: { jobs: {}, jobsStatus: {} },
    };
    const result = await firstValueFrom(
      addPlaylistEpic(action$, { value: state } as any, {} as any)
    );
    expect(result).toEqual(
      playlistsSlice.actions.fetchPlaylistLevels({ playlistID: "1" })
    );
  });
});
