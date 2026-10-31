import { describe, expect, it } from "vitest";
import { Level, Playlist } from "../src/entities";
import { selectBulkDownloads } from "../src/use-cases/select-bulk-downloads";

const playlist = (id: string) =>
  new Playlist(id, `https://example.com/${id}.m3u8`, 1, id);
const level = (
  id: string,
  playlistID: string,
  properties: Partial<Level> = {},
): Level => ({
  type: "stream",
  id,
  playlistID,
  uri: `https://example.com/${id}.m3u8`,
  ...properties,
});

describe("bulk download selections", () => {
  it("selects the highest resolution below the cap independently for each playlist", () => {
    const items = selectBulkDownloads({
      playlists: [playlist("p"), playlist("q")],
      maxHeight: 720,
      levels: [
        level("1080", "p", { height: 1080 }),
        level("720", "p", { height: 720 }),
        level("360", "p", { height: 360 }),
        level("480", "q", { height: 480 }),
      ],
    });
    expect(items.map((item) => item.video?.id)).toEqual(["720", "480"]);
  });
  it("chooses resolution then bitrate for best available without mutating the source", () => {
    const levels = Object.freeze([
      level("low", "p", { height: 720, bitrate: 9e6 }),
      level("high", "p", { height: 1080, bitrate: 2e6 }),
      level("best", "p", { height: 1080, bitrate: 4e6 }),
    ]);
    expect(
      selectBulkDownloads({
        playlists: [playlist("p")],
        levels: [...levels],
      })[0].video?.id,
    ).toBe("best");
    expect(levels[0].id).toBe("low");
  });
  it.each([1080, undefined])(
    "reports unavailable capped quality instead of exceeding it (%s)",
    (height) => {
      const [item] = selectBulkDownloads({
        playlists: [playlist("p")],
        maxHeight: 720,
        levels: [level("v", "p", { height })],
      });
      expect(item.video).toBeUndefined();
      expect(item.error).toContain("at or below 720p");
    },
  );
  it("never uses another playlist's tracks and reports empty selections independently", () => {
    const items = selectBulkDownloads({
      playlists: [playlist("p"), playlist("q"), playlist("p")],
      levels: [null, level("v", "p")],
    });
    expect(items).toHaveLength(2);
    expect(items[0].video?.id).toBe("v");
    expect(items[1].error).toContain("No downloadable tracks");
  });
  it("keeps audio within the chosen video's group even when saved preferences point elsewhere", () => {
    const [item] = selectBulkDownloads({
      playlists: [playlist("p")],
      preferredAudioLanguage: "ES",
      audioSelections: { p: "wrong" },
      levels: [
        level("v", "p", { audioGroupId: "main" }),
        level("wrong", "p", {
          type: "audio",
          groupId: "other",
          language: "es",
        }),
        level("default", "p", {
          type: "audio",
          groupId: "main",
          language: "en",
          isDefault: true,
        }),
        level("preferred", "p", {
          type: "audio",
          groupId: "main",
          language: "es",
        }),
      ],
    });
    expect(item.audio?.id).toBe("preferred");
  });
  it("honors compatible saved audio and subtitle choices", () => {
    const [item] = selectBulkDownloads({
      playlists: [playlist("p")],
      preferredAudioLanguage: "en",
      audioSelections: { p: "es" },
      subtitleSelections: { p: "captions" },
      levels: [
        level("v", "p", { audioGroupId: "main" }),
        level("en", "p", {
          type: "audio",
          groupId: "main",
          language: "en",
          isDefault: true,
        }),
        level("es", "p", { type: "audio", groupId: "main", language: "es" }),
        level("captions", "p", { type: "subtitle", language: "es" }),
      ],
    });
    expect(item.audio?.id).toBe("es");
    expect(item.subtitle?.id).toBe("captions");
  });
  it("reports a missing external audio group instead of silently downloading video without audio", () => {
    const [item] = selectBulkDownloads({
      playlists: [playlist("p")],
      levels: [
        level("v", "p", { audioGroupId: "main" }),
        level("other", "p", { type: "audio", groupId: "other" }),
      ],
    });
    expect(item.error).toContain("No audio track matches");
  });
  it("preserves embedded audio instead of attaching an unrelated external track", () => {
    const [item] = selectBulkDownloads({
      playlists: [playlist("p")],
      levels: [level("v", "p"), level("other", "p", { type: "audio" })],
    });
    expect(item.video?.id).toBe("v");
    expect(item.audio).toBeUndefined();
  });
  it("supports audio-only playlists with a video quality cap and language preference", () => {
    const [item] = selectBulkDownloads({
      playlists: [playlist("p")],
      maxHeight: 720,
      preferredAudioLanguage: "es",
      levels: [
        level("en", "p", { type: "audio", language: "en", isDefault: true }),
        level("es", "p", { type: "audio", language: "es" }),
      ],
    });
    expect(item.video?.id).toBe("es");
    expect(item.audio).toBeUndefined();
  });
});
