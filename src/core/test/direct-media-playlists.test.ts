import { describe, expect, it, vi } from "vitest";
import { getLevelsFactory } from "../src/use-cases/get-levels";

describe("direct media playlists (#245)", () => {
  it("offers a stable downloadable primary level for a direct media playlist", async () => {
    const uri = "https://example.com/nested/playlist.m3u8?token=secret";
    const text =
      "#EXTM3U\n#EXT-X-TARGETDURATION:8\n#EXTINF:8,\nsegment.ts\n#EXT-X-ENDLIST\n";
    const parser = {
      parseMasterPlaylist: vi.fn().mockReturnValue([]),
      parseLevelPlaylist: vi
        .fn()
        .mockReturnValue([{ uri: "https://example.com/nested/segment.ts" }]),
    };
    const loader = { fetchText: vi.fn().mockResolvedValue(text) };
    const first = await getLevelsFactory(loader as any, parser as any)(uri, 2);
    const next = await getLevelsFactory(loader as any, parser as any)(uri, 2);
    expect(first).toHaveLength(1);
    expect(first[0]).toMatchObject({ type: "stream", playlistID: uri, uri });
    expect(next[0].id).toBe(first[0].id);
    const other = await getLevelsFactory(loader as any, parser as any)(
      uri + "-other",
      2,
    );
    expect(other[0].id).not.toBe(first[0].id);
    expect(loader.fetchText).toHaveBeenCalledWith(uri, 2);
  });

  it.each([
    "<html>Error</html>",
    "WEBVTT\n\n",
    "#EXTM3U\n#EXT-X-TARGETDURATION:8\n",
  ])(
    "does not invent a primary stream for an invalid or empty manifest",
    async (text) => {
      const parser = {
        parseMasterPlaylist: vi.fn().mockReturnValue([]),
        parseLevelPlaylist: vi.fn().mockReturnValue([]),
      };
      expect(
        await getLevelsFactory(
          { fetchText: vi.fn().mockResolvedValue(text) } as any,
          parser as any,
        )("https://example.com/master.m3u8", 1),
      ).toEqual([]);
    },
  );
});
