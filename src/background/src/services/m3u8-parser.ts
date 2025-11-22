/// <reference path="m3u8-parser.d.ts" />

import { Fragment, Level, LevelType } from "@hls-downloader/core/lib/entities";
import { IParser } from "@hls-downloader/core/lib/services";
import { Parser } from "m3u8-parser";
import { buildAbsoluteURL } from "url-toolkit";
import { v4 } from "uuid";

export const M3u8Parser: IParser = {
  parseLevelPlaylist(string: string, baseurl: string): Fragment[] {
    const parser = new Parser();
    parser.push(string);

    const segments = parser.manifest.segments;
    const fragments: Fragment[] = [];

    let index = 0;
    let currentMapUri: string | null = null;
    let currentMapByteRange: string | null = null;

    segments.forEach((segment) => {
      if (segment.map && segment.map.uri) {
        const mapUri = buildAbsoluteURL(baseurl, segment.map.uri);
        const mapByteRange = segment.map.byterange
          ? `${segment.map.byterange.offset}:${segment.map.byterange.length}`
          : null;

        if (mapUri !== currentMapUri || mapByteRange !== currentMapByteRange) {
          fragments.push({
            index,
            key:
              segment.key && segment.key.uri
                ? {
                    iv: segment.key.iv ?? null,
                    uri: buildAbsoluteURL(baseurl, segment.key.uri),
                  }
                : { iv: null, uri: null },
            uri: mapUri,
          });
          index++;
          currentMapUri = mapUri;
          currentMapByteRange = mapByteRange;
        }
      }

      fragments.push({
        index,
        key:
          segment.key && segment.key.uri
            ? {
                iv: segment.key.iv ?? null,
                uri: buildAbsoluteURL(baseurl, segment.key.uri),
              }
            : { iv: null, uri: null },
        uri: buildAbsoluteURL(baseurl, segment.uri),
      });
      index++;
    });

    return fragments;
  },
  parseMasterPlaylist(string: string, baseurl: string): Level[] {
    const parser = new Parser();
    parser.push(string);
    const playlists = parser.manifest?.playlists ?? [];
    const mediaGroups = parser.manifest?.mediaGroups ?? {};
    const audioPlaylists = mediaGroups.AUDIO ?? {};
    const subtitlePlaylists = mediaGroups.SUBTITLES ?? {};
    const closedCaptions = mediaGroups["CLOSED-CAPTIONS"] ?? {};
    const results = playlists.map((playlist) => ({
      type: "stream" as LevelType,
      id: v4(),
      playlistID: baseurl,
      uri: buildAbsoluteURL(baseurl, playlist.uri),
      bitrate: playlist.attributes.BANDWIDTH,
      fps: playlist.attributes["FRAME-RATE"],
      height: playlist.attributes.RESOLUTION?.height,
      width: playlist.attributes.RESOLUTION?.width,
    }));

    const audioResults = Object.entries(audioPlaylists).flatMap(
      ([key, entries]) => {
        return Object.entries(entries).map(([label, entry]) => {
          return {
            type: "audio" as LevelType,
            id: `${label}-${key}`,
            playlistID: baseurl,
            uri: buildAbsoluteURL(baseurl, entry.uri),
            bitrate: undefined,
            fps: undefined,
            width: undefined,
            height: undefined,
            language: entry.language ?? entry.lang,
            name: entry.name ?? label,
            characteristics: entry.characteristics,
            channels: entry.channels,
          };
        });
      },
    );

    const subtitleResults = Object.entries(subtitlePlaylists).flatMap(
      ([groupId, entries]) => {
        return Object.entries(entries)
          .map(([label, entry]) => {
            if (!entry.uri) {
              return null;
            }
            return {
              type: "subtitle" as LevelType,
              id: `${label}-${groupId}`,
              playlistID: baseurl,
              uri: buildAbsoluteURL(baseurl, entry.uri),
              language: entry.language ?? entry.lang,
              name: entry.name ?? label,
              characteristics: entry.characteristics,
            };
          })
          .flatMap((entry) => (entry ? [entry] : []));
      },
    );

    const closedCaptionResults = Object.entries(closedCaptions).flatMap(
      ([groupId, entries]) => {
        return Object.entries(entries)
          .map(([label, entry]) => {
            if (!entry.uri) {
              return null;
            }
            return {
              type: "subtitle" as LevelType,
              id: `${label}-${groupId}-cc`,
              playlistID: baseurl,
              uri: buildAbsoluteURL(baseurl, entry.uri),
              language: entry.language ?? entry.lang,
              name: entry.name ?? label,
              characteristics: entry.characteristics,
              instreamId: entry.instreamId,
            };
          })
          .flatMap((entry) => (entry ? [entry] : []));
      },
    );

    return results
      .concat(audioResults)
      .concat(subtitleResults)
      .concat(closedCaptionResults);
  },
};
