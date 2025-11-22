import { Fragment, Level } from "../entities";

export interface ParsedEncryption {
  methods: string[];
  keyUris: string[];
  iv?: string | null;
}

export interface IParser {
  parseMasterPlaylist(string: string, baseurl: string): Level[];
  parseLevelPlaylist(string: string, baseurl: string): Fragment[];
  inspectLevelEncryption(string: string, baseurl: string): ParsedEncryption;
}
