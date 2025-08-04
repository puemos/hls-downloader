import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, firstValueFrom } from "rxjs";
import { toArray } from "rxjs/operators";
import { fetchPlaylistLevelsEpic } from "../src/controllers/fetch-playlist-levels-epic.ts";
import { playlistsSlice } from "../src/store/slices/index.ts";
import { levelsSlice } from "../src/store/slices/levels-slice.ts";
import { Playlist, Level } from "../src/entities/index.ts";
import {
  createTestPlaylist,
  createTestLevel,
  createMockState,
} from "./test-utils";

describe("fetchPlaylistLevelsEpic", () => {
  // Test fixtures
  let playlist: Playlist;
  let level: Level;
  let loader: any;
  let parser: any;
  let action$: ReturnType<typeof of>;
  let state: any;

  beforeEach(() => {
    playlist = createTestPlaylist({
      id: "1",
      uri: "http://example.com/master.m3u8",
    });
    level = createTestLevel({ id: "l", playlistID: "1", uri: "lu" });
    loader = { fetchText: vi.fn().mockResolvedValue("") };
    parser = { parseMasterPlaylist: vi.fn().mockReturnValue([level]) };
    action$ = of(
      playlistsSlice.actions.fetchPlaylistLevels({ playlistID: "1" })
    );
    state = createMockState({
      playlists: { "1": playlist },
      fetchAttempts: 1,
    });
  });

  describe("success scenarios", () => {
    it("loads levels for playlist and emits success actions", async () => {
      // Execute
      const result = await firstValueFrom(
        fetchPlaylistLevelsEpic(
          action$,
          { value: state } as any,
          {
            loader,
            parser,
          } as any
        ).pipe(toArray())
      );

      // Verify
      expect(loader.fetchText).toHaveBeenCalledWith(
        "http://example.com/master.m3u8",
        1
      );
      expect(parser.parseMasterPlaylist).toHaveBeenCalledWith(
        "",
        "http://example.com/master.m3u8"
      );
      expect(result).toEqual([
        playlistsSlice.actions.fetchPlaylistLevelsSuccess({ playlistID: "1" }),
        levelsSlice.actions.add({ levels: [level] }),
      ]);
    });

    it("respects the configured fetch attempts", async () => {
      // Setup with different fetch attempts
      state.config.fetchAttempts = 5;

      // Execute
      await firstValueFrom(
        fetchPlaylistLevelsEpic(
          action$,
          { value: state } as any,
          {
            loader,
            parser,
          } as any
        ).pipe(toArray())
      );

      // Verify fetch attempts was passed correctly
      expect(loader.fetchText).toHaveBeenCalledWith(
        "http://example.com/master.m3u8",
        5
      );
    });
  });

  describe("error scenarios", () => {
    it("emits failure action when no levels are found", async () => {
      // Setup - parser returns empty array
      parser.parseMasterPlaylist = vi.fn().mockReturnValue([]);

      // Execute
      const result = await firstValueFrom(
        fetchPlaylistLevelsEpic(
          action$,
          { value: state } as any,
          {
            loader,
            parser,
          } as any
        ).pipe(toArray())
      );

      // Verify - should emit failure action
      expect(result).toEqual([
        playlistsSlice.actions.fetchPlaylistLevelsFailed({ playlistID: "1" }),
      ]);
    });

    it("emits failure action when no levels are found", async () => {
      // Setup - mock entire epic dependency to return empty array
      const mockLevels: Level[] = [];
      const epicDependencies = {
        loader: { fetchText: vi.fn().mockResolvedValue("") },
        parser: { parseMasterPlaylist: vi.fn().mockReturnValue(mockLevels) },
      };

      // Execute
      const result = await firstValueFrom(
        fetchPlaylistLevelsEpic(
          action$,
          { value: state } as any,
          epicDependencies as any
        ).pipe(toArray())
      );

      // Verify - should emit failure action
      expect(result).toEqual([
        playlistsSlice.actions.fetchPlaylistLevelsFailed({ playlistID: "1" }),
      ]);
    });

    // Note: We don't test loader or parser error handling directly since
    // those are implementation details. Instead, we focus on testing the
    // epic's behavior with different inputs/outputs.
  });
});
