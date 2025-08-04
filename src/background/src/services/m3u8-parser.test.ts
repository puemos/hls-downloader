import { describe, it, expect } from "vitest";
import { M3u8Parser } from "./m3u8-parser";

const base = "http://example.com/";

const playlist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-KEY:METHOD=AES-128,URI="key.key"
#EXT-X-MAP:URI="init0.mp4"
#EXTINF:6.000,
seg0.ts
#EXTINF:6.000,
seg1.ts
#EXT-X-MAP:URI="init1.mp4"
#EXTINF:6.000,
seg2.ts
`;

const byterangePlaylist = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-MAP:URI="init.mp4",BYTERANGE="1000@0"
#EXTINF:6.000,
seg0.ts
#EXT-X-MAP:URI="init.mp4",BYTERANGE="1000@1000"
#EXTINF:6.000,
seg1.ts
`;

const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="eng",DEFAULT=YES,AUTOSELECT=YES,URI="eng.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="spa",DEFAULT=NO,AUTOSELECT=YES,URI="spa.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,FRAME-RATE=30,AUDIO="audio"
low.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=1280x720,FRAME-RATE=60,AUDIO="audio"
high.m3u8
`;

describe("M3u8Parser", () => {
  it("inserts init fragments when EXT-X-MAP changes", () => {
    const fragments = M3u8Parser.parseLevelPlaylist(playlist, base);
    expect(fragments.map((f) => f.uri)).toEqual([
      `${base}init0.mp4`,
      `${base}seg0.ts`,
      `${base}seg1.ts`,
      `${base}init1.mp4`,
      `${base}seg2.ts`,
    ]);
    expect(fragments.map((f) => f.index)).toEqual([0, 1, 2, 3, 4]);
    expect(fragments[0].key.uri).toBe(`${base}key.key`);
  });

  it("re-inserts init fragment when BYTERANGE changes", () => {
    const fragments = M3u8Parser.parseLevelPlaylist(byterangePlaylist, base);
    expect(fragments.map((f) => f.uri)).toEqual([
      `${base}init.mp4`,
      `${base}seg0.ts`,
      `${base}init.mp4`,
      `${base}seg1.ts`,
    ]);
    expect(fragments.map((f) => f.index)).toEqual([0, 1, 2, 3]);
  });

  it("parses master playlist with stream and audio variants", () => {
    const masterBase = `${base}master.m3u8`;
    const levels = M3u8Parser.parseMasterPlaylist(masterPlaylist, masterBase);
    expect(levels).toHaveLength(4);
    const [stream0, stream1, audioEng, audioSpa] = levels;

    expect(stream0).toMatchObject({
      type: "stream",
      playlistID: masterBase,
      uri: `${base}low.m3u8`,
      bitrate: 800000,
      fps: 30,
      width: 640,
      height: 360,
    });
    expect(typeof stream0.id).toBe("string");

    expect(stream1).toMatchObject({
      type: "stream",
      playlistID: masterBase,
      uri: `${base}high.m3u8`,
      bitrate: 1400000,
      fps: 60,
      width: 1280,
      height: 720,
    });
    expect(typeof stream1.id).toBe("string");

    expect(audioEng).toEqual({
      type: "audio",
      id: "eng-audio",
      playlistID: masterBase,
      uri: `${base}eng.m3u8`,
      bitrate: undefined,
      fps: undefined,
      width: undefined,
      height: undefined,
    });

    expect(audioSpa).toEqual({
      type: "audio",
      id: "spa-audio",
      playlistID: masterBase,
      uri: `${base}spa.m3u8`,
      bitrate: undefined,
      fps: undefined,
      width: undefined,
      height: undefined,
    });
  });
});
