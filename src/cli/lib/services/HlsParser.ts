// @ts-ignore
import { Parser } from "m3u8-parser";
// @ts-ignore
import * as resolveUrl from "@videojs/vhs-utils/dist/resolve-url";
import { Fragment } from "core/dist/entities/fragment";
import { Playlist } from "core/dist/entities/playlist";

function parseMasterPlaylist(string: string, baseurl: string): Playlist[] {
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
      iv: null,
      uri: null,
    },
  }));
}

export const HlsParser = {
  parseMasterPlaylist,
  parseLevelPlaylist,
};
