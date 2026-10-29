import { describe, expect, it } from "vitest";
import type { Level } from "../src/entities";
import { levelsSlice } from "../src/store/slices/levels-slice";
import { playlistPreferencesSlice } from "../src/store/slices/playlist-preferences-slice";

const tracks: Level[] = ["first", "second"].flatMap((playlistID) => [
  {
    type: "audio",
    id: `${playlistID}-audio`,
    playlistID,
    uri: `https://example.com/${playlistID}/audio.m3u8`,
    name: "English",
    groupId: "audio",
  },
  {
    type: "subtitle",
    id: `${playlistID}-subtitles`,
    playlistID,
    uri: `https://example.com/${playlistID}/subtitles.m3u8`,
    name: "English",
    groupId: "subtitles",
  },
]);

describe("playlist preferences", () => {
  it("updates legacy track selections only for the playlist being loaded", () => {
    const saved = {
      audioSelections: { first: "English-audio", second: "English-audio" },
      subtitleSelections: {
        first: "English-subtitles",
        second: "English-subtitles",
      },
    };
    const first = playlistPreferencesSlice.reducer(
      saved,
      levelsSlice.actions.add({ levels: tracks.slice(0, 2) }),
    );

    expect(first).toEqual({
      audioSelections: { first: "first-audio", second: "English-audio" },
      subtitleSelections: {
        first: "first-subtitles",
        second: "English-subtitles",
      },
    });

    const second = playlistPreferencesSlice.reducer(
      first,
      levelsSlice.actions.add({ levels: tracks.slice(2) }),
    );
    expect(second).toEqual({
      audioSelections: { first: "first-audio", second: "second-audio" },
      subtitleSelections: {
        first: "first-subtitles",
        second: "second-subtitles",
      },
    });
  });

  it("preserves current selections and an explicit choice of no subtitles", () => {
    const saved = {
      audioSelections: { first: "first-audio" },
      subtitleSelections: { first: "" },
    };
    const state = playlistPreferencesSlice.reducer(
      saved,
      levelsSlice.actions.add({ levels: tracks }),
    );

    expect(state).toEqual(saved);
  });

  it("does not replace unavailable selections with an unrelated track", () => {
    const saved = {
      audioSelections: { first: "Spanish-audio" },
      subtitleSelections: { first: "Spanish-subtitles" },
    };
    const state = playlistPreferencesSlice.reducer(
      saved,
      levelsSlice.actions.add({ levels: tracks }),
    );

    expect(state).toEqual(saved);
  });

  it("does not guess when a legacy selection matches multiple tracks", () => {
    const saved = {
      audioSelections: { first: "a-b-c" },
      subtitleSelections: {},
    };
    const state = playlistPreferencesSlice.reducer(
      saved,
      levelsSlice.actions.add({
        levels: [
          { ...tracks[0], name: "a-b", groupId: "c" },
          { ...tracks[0], id: "other-audio", name: "a", groupId: "b-c" },
        ],
      }),
    );

    expect(state).toEqual(saved);
  });

  it("updates legacy closed-caption selections", () => {
    const saved = {
      audioSelections: {},
      subtitleSelections: { first: "English-subtitles-cc" },
    };
    const state = playlistPreferencesSlice.reducer(
      saved,
      levelsSlice.actions.add({
        levels: [{ ...tracks[1], instreamId: "CC1" }],
      }),
    );

    expect(state.subtitleSelections.first).toBe("first-subtitles");
  });
});
