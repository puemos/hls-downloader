import { Fragment, Level } from "../entities";

export interface IParser {
  parseMasterPlaylist(string: string, baseurl: string): Level[];
  parseLevelPlaylist(
    string: string,
    baseurl: string,
    index: number
  ): Fragment[];
}
