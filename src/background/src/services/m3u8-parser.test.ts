import { describe, it, expect } from 'vitest';
import { M3u8Parser } from './m3u8-parser';

const base = 'http://example.com/';

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

describe('M3u8Parser', () => {
  it('inserts init fragments when EXT-X-MAP changes', () => {
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

  it('re-inserts init fragment when BYTERANGE changes', () => {
    const fragments = M3u8Parser.parseLevelPlaylist(byterangePlaylist, base);
    expect(fragments.map((f) => f.uri)).toEqual([
      `${base}init.mp4`,
      `${base}seg0.ts`,
      `${base}init.mp4`,
      `${base}seg1.ts`,
    ]);
    expect(fragments.map((f) => f.index)).toEqual([0, 1, 2, 3]);
  });
});
