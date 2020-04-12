// @ts-ignore
import { Parser } from "m3u8-parser";
// @ts-ignore
import resolveUrl from "@videojs/vhs-utils/dist/resolve-url";
import { Fragment } from "core/dist/entities/fragment";
import { Level } from "core/dist/entities/level";

function parseMasterPlaylist(string: string, baseurl: string): Level[] {
  // @ts-ignore
  const parser = new Parser();
  parser.push(string);
  parser.end();
  return parser.manifest.playlists.map((l: any, index: number) => ({
    index: index,
    uri: resolveUrl(baseurl, l.uri),
    width: 0,
    height: 0,
    bitrate: 0,
  }));
}

function parseLevelPlaylist(
  string: string,
  baseurl: string,
  index: number
): Fragment[] {
  // @ts-ignore
  const parser = new Parser();
  parser.push(string);
  parser.end();
  return parser.manifest.segments.map((s: any, index: number) => ({
    index: index,
    uri: resolveUrl(baseurl, s.uri),
    key: {
      iv: s.decryptdata?.iv,
      uri: s.decryptdata?.uri,
    },
  }));
}

export const HlsParser = {
  parseMasterPlaylist,
  parseLevelPlaylist,
};
