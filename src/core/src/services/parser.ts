import { Fragment, Playlist } from "../entities";

export interface IParser {
  parseMasterPlaylist(string: string, baseurl: string): Playlist[];
  parseLevelPlaylist(
    string: string,
    baseurl: string,
    index: number
  ): Fragment[];
}
