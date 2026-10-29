import { describe, expect, it } from "vitest";
import { rootReducer } from "@hls-downloader/core/lib/store/root-reducer";
import {
  levelInspectionsSlice,
  levelsSlice,
  playlistPreferencesSlice,
} from "@hls-downloader/core/lib/store/slices";
import { M3u8Parser } from "../src/services/m3u8-parser";

const masterPlaylist = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",URI="audio.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subtitles",NAME="English",LANGUAGE="en",URI="subtitles.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=800000,AUDIO="audio",SUBTITLES="subtitles"
video.m3u8
`;

describe("playlist track identity", () => {
  it.each([
    [
      "https://example.com/one/master.m3u8",
      "https://example.com/two/master.m3u8",
    ],
    [
      "https://example.com/master.m3u8?video=1",
      "https://example.com/master.m3u8?video=2",
    ],
  ])(
    "keeps tracks and their state independent for %s and %s",
    (firstUrl, secondUrl) => {
      const tracks = [firstUrl, secondUrl].flatMap((url) =>
        M3u8Parser.parseMasterPlaylist(masterPlaylist, url).filter(
          (level) => level.type !== "stream",
        ),
      );
      let state = rootReducer(undefined, { type: "init/start" });

      tracks.forEach((track, index) => {
        state = rootReducer(
          state,
          levelsSlice.actions.add({ levels: [track] }),
        );
        state = rootReducer(
          state,
          levelsSlice.actions.setDuration({
            levelId: track.id,
            durationSec: index + 1,
          }),
        );
        state = rootReducer(
          state,
          levelInspectionsSlice.actions.inspectSuccess({
            inspection: {
              levelId: track.id,
              playlistId: track.playlistID,
              supported: index % 2 === 0,
              method: null,
              keyUris: [],
            },
          }),
        );
      });

      expect(Object.values(state.levels.levels)).toHaveLength(4);
      tracks.forEach((track, index) => {
        expect(state.levels.levels[track.id]).toEqual(track);
        expect(state.levels.durations[track.id]).toBe(index + 1);
        expect(state.levelInspections.inspections[track.id]).toMatchObject({
          playlistId: track.playlistID,
          supported: index % 2 === 0,
        });
      });

      state = rootReducer(
        state,
        levelsSlice.actions.removePlaylistLevels({ playlistID: firstUrl }),
      );
      expect(Object.values(state.levels.levels)).toEqual(tracks.slice(2));
      tracks.slice(2).forEach((track, index) => {
        expect(state.levels.durations[track.id]).toBe(index + 3);
      });
    },
  );

  it("keeps audio and subtitles distinct when their names and groups match", () => {
    const levels = M3u8Parser.parseMasterPlaylist(
      masterPlaylist.replaceAll('="subtitles"', '="audio"'),
      "https://example.com/master.m3u8",
    );
    const state = rootReducer(undefined, levelsSlice.actions.add({ levels }));

    expect(
      Object.values(state.levels.levels).map((level) => level?.type),
    ).toEqual(["stream", "audio", "subtitle"]);
  });

  it.each(["AUDIO", "SUBTITLES"])(
    "keeps %s tracks distinct when names and groups contain hyphens",
    (type) => {
      const manifest = `#EXTM3U
#EXT-X-MEDIA:TYPE=${type},GROUP-ID="c",NAME="a-b",URI="first.m3u8"
#EXT-X-MEDIA:TYPE=${type},GROUP-ID="b-c",NAME="a",URI="second.m3u8"
`;
      const levels = M3u8Parser.parseMasterPlaylist(
        manifest,
        "https://example.com/master.m3u8",
      );
      const state = rootReducer(undefined, levelsSlice.actions.add({ levels }));

      expect(
        Object.values(state.levels.levels).map((level) => level?.uri),
      ).toEqual([
        "https://example.com/first.m3u8",
        "https://example.com/second.m3u8",
      ]);
    },
  );

  it("preserves track IDs and selections when a playlist is parsed again", () => {
    const url = "https://example.com/master.m3u8";
    const first = M3u8Parser.parseMasterPlaylist(masterPlaylist, url).filter(
      (level) => level.type !== "stream",
    );
    const refreshed = M3u8Parser.parseMasterPlaylist(
      masterPlaylist,
      url,
    ).filter((level) => level.type !== "stream");

    expect(refreshed.map((level) => level.id)).toEqual(
      first.map((level) => level.id),
    );
    let state = rootReducer(
      undefined,
      levelsSlice.actions.add({ levels: first }),
    );
    state = rootReducer(
      state,
      playlistPreferencesSlice.actions.setAudioSelection({
        playlistID: url,
        levelID: first[0].id,
      }),
    );
    state = rootReducer(
      state,
      playlistPreferencesSlice.actions.setSubtitleSelection({
        playlistID: url,
        levelID: first[1].id,
      }),
    );
    state = rootReducer(state, levelsSlice.actions.add({ levels: refreshed }));
    expect(Object.values(state.levels.levels)).toEqual(refreshed);
    expect(state.playlistPreferences.audioSelections[url]).toBe(
      refreshed[0].id,
    );
    expect(state.playlistPreferences.subtitleSelections[url]).toBe(
      refreshed[1].id,
    );
  });
});
