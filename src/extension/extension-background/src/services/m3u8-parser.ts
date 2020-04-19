/// <reference path="m3u8-parser.d.ts" />

import { Fragment, Level } from "@hls-downloader/core/lib/entities";
import { IParser } from "@hls-downloader/core/lib/services";
import { Parser } from "m3u8-parser";
import { buildAbsoluteURL } from "url-toolkit";
import { v4 } from "uuid";

export const M3u8Parser: IParser = {
  parseLevelPlaylist(string: string, baseurl: string): Fragment[] {
    const parser = new Parser();
    parser.push(string);
    return parser.manifest.segments.map((segment, index) => ({
      index,
      key: segment.key
        ? {
            iv: segment.key.iv,
            uri: buildAbsoluteURL(baseurl, segment.key.uri),
          }
        : {
            iv: null,
            uri: null,
          },
      uri: buildAbsoluteURL(baseurl, segment.uri),
    }));
  },
  parseMasterPlaylist(string: string, baseurl: string): Level[] {
    const parser = new Parser();
    parser.push(string);
    const playlists = parser.manifest?.playlists ?? [];
    return playlists.map((playlist, index) => ({
      index,
      id: v4(),
      playlistID: baseurl,
      bitrate: playlist.attributes.BANDWIDTH,
      height: playlist.attributes.RESOLUTION?.height,
      width: playlist.attributes.RESOLUTION?.width,
      uri: buildAbsoluteURL(baseurl, playlist.uri),
    }));
  },
};
