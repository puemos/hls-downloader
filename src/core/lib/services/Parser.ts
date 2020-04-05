import M3U8Parser from "hls.js/src/loader/m3u8-parser";
import HlsFragment from "hls.js/src/loader/fragment";
import { Level } from "../entities/level";
import { Fragment } from "../entities/fragment";
import { PlaylistLevelType } from "hls.js/src/types/loader";

export interface Parser {
  parseMasterPlaylist(string: string, baseurl: string): Level[];
  parseLevelPlaylist(
    string: string,
    baseurl: string,
    index: number
  ): Fragment[];
}

function parseMasterPlaylist(string: string, baseurl: string): Level[] {
  const levels = M3U8Parser.parseMasterPlaylist(string, baseurl);
  return levels.map((l: any, index: number) => ({
    index: index,
    uri: l.url,
    width: l.width,
    height: l.height,
    bitrate: l.bitrate,
  }));
}

function parseLevelPlaylist(
  string: string,
  baseurl: string,
  index: number
): Fragment[] {
  const level = M3U8Parser.parseLevelPlaylist(
    string,
    baseurl,
    index,
    PlaylistLevelType.MAIN,
    index
  );
  return level.fragments.map((f: any, index: number) => ({
    index: index,
    uri: f.url,
    key: {
      iv: (f as HlsFragment).decryptdata?.iv,
      uri: (f as HlsFragment).decryptdata?.uri,
    },
  }));
}

const parser: Parser = {
  parseMasterPlaylist,
  parseLevelPlaylist,
};

export default parser;
