import { Fragment } from "../entities/fragment";
import { Level } from "../entities/level";

export interface Parser {
  parseMasterPlaylist(string: string, baseurl: string): Level[];
  parseLevelPlaylist(
    string: string,
    baseurl: string,
    index: number
  ): Fragment[];
}
