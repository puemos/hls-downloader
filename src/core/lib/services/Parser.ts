import { Fragment } from "../entities/fragment";
import { Playlist } from "../entities/playlist";

export interface IParser {
  parseMasterPlaylist(string: string, baseurl: string): Playlist[];
  parseLevelPlaylist(
    string: string,
    baseurl: string,
    index: number
  ): Fragment[];
}
