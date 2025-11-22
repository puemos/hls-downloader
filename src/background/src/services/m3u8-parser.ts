/// <reference path="m3u8-parser.d.ts" />

import { Fragment, Level, LevelType } from "@hls-downloader/core/lib/entities";
import { IParser, ParsedEncryption } from "@hls-downloader/core/lib/services";
import { Parser } from "m3u8-parser";
import { buildAbsoluteURL } from "url-toolkit";
import { v4 } from "uuid";

export const M3u8Parser: IParser = {
  parseLevelPlaylist(string: string, baseurl: string): Fragment[] {
    const parser = new Parser();
    parser.push(string);
    parser.end();

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
  parseMasterPlaylist(manifestText: string, baseurl: string): Level[] {
    const parser = new Parser();
    parser.push(manifestText);
    parser.end();
    const playlists = parser.manifest?.playlists ?? [];
    const mediaGroups = parser.manifest?.mediaGroups ?? {};
    const audioPlaylists = mediaGroups.AUDIO ?? {};
    const subtitlePlaylists = mediaGroups.SUBTITLES ?? {};
    const closedCaptions = mediaGroups["CLOSED-CAPTIONS"] ?? {};
    const parseAttributes = (line: string) => {
      const attributes: Record<string, string> = {};
      const regex = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        const key = match[1];
        const rawValue = match[2];
        attributes[key] =
          rawValue && rawValue.startsWith('"') && rawValue.endsWith('"')
            ? rawValue.slice(1, -1)
            : rawValue;
      }
      return attributes;
    };

    const audioAttributes: Record<
      string,
      Record<string, { channels?: string; characteristics?: string }>
    > = {};

    const subtitleAttributes: Record<
      string,
      Record<string, { forced?: boolean; characteristics?: string }>
    > = {};

    manifestText
      .split("\n")
      .filter((line) => line.startsWith("#EXT-X-MEDIA:TYPE=AUDIO"))
      .forEach((line) => {
        const attrs = parseAttributes(line);
        const groupId = attrs["GROUP-ID"];
        const name = attrs["NAME"];
        if (!groupId || !name) return;
        audioAttributes[groupId] = audioAttributes[groupId] ?? {};
        audioAttributes[groupId][name] = {
          channels: attrs["CHANNELS"],
          characteristics: attrs["CHARACTERISTICS"],
        };
      });

    manifestText
      .split("\n")
      .filter((line) => line.startsWith("#EXT-X-MEDIA:TYPE=SUBTITLES"))
      .forEach((line) => {
        const attrs = parseAttributes(line);
        const groupId = attrs["GROUP-ID"];
        const name = attrs["NAME"];
        if (!groupId || !name) return;
        subtitleAttributes[groupId] = subtitleAttributes[groupId] ?? {};
        subtitleAttributes[groupId][name] = {
          forced: attrs["FORCED"] === "YES",
          characteristics: attrs["CHARACTERISTICS"],
        };
      });
    const results = playlists.map((playlist) => ({
      type: "stream" as LevelType,
      id: v4(),
      playlistID: baseurl,
      uri: buildAbsoluteURL(baseurl, playlist.uri),
      bitrate: playlist.attributes.BANDWIDTH,
      fps: playlist.attributes["FRAME-RATE"],
      height: playlist.attributes.RESOLUTION?.height,
      width: playlist.attributes.RESOLUTION?.width,
      audioGroupId: playlist.attributes.AUDIO,
    }));

    const audioResults = Object.entries(audioPlaylists).flatMap(
      ([key, entries]) => {
        return Object.entries(entries).map(([label, entry]) => {
          const extraAttributes = audioAttributes[key]?.[label];
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
            characteristics:
              entry.characteristics ?? extraAttributes?.characteristics,
            channels: entry.channels ?? extraAttributes?.channels,
            isDefault: entry.default ?? undefined,
            autoSelect: entry.autoselect ?? undefined,
            groupId: key,
          };
        });
      },
    );

    const subtitleResults = Object.entries(subtitlePlaylists).flatMap(
      ([groupId, entries]) => {
        return Object.entries(entries)
          .map(([label, entry]) => {
            const extraAttributes = subtitleAttributes[groupId]?.[label];
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
              characteristics:
                entry.characteristics ?? extraAttributes?.characteristics,
              isDefault: entry.default ?? undefined,
              autoSelect: entry.autoselect ?? undefined,
              forced: entry.forced ?? extraAttributes?.forced ?? undefined,
              groupId,
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
              isDefault: entry.default ?? undefined,
              autoSelect: entry.autoselect ?? undefined,
              groupId,
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
  inspectLevelEncryption(string: string, baseurl: string): ParsedEncryption {
    const parser = new Parser();
    parser.push(string);
    parser.end();
    const segments = parser.manifest.segments ?? [];
    const methods = new Set<string>();
    const keyUris = new Set<string>();
    let iv: string | null = null;

    function normalizeMethod(method?: string | null) {
      return method ? method.toUpperCase() : null;
    }

    function collectKey(key: any) {
      const method = normalizeMethod(key?.method);
      if (method && method !== "NONE") {
        methods.add(method);
      }
      if (key?.uri) {
        keyUris.add(buildAbsoluteURL(baseurl, key.uri));
      }
      if (key?.iv && !iv) {
        if (typeof key.iv === "string") {
          iv = key.iv;
        } else if (ArrayBuffer.isView(key.iv)) {
          if (key.iv instanceof Uint32Array) {
            iv = `0x${Array.from(key.iv)
              .map((v) => v.toString(16).padStart(8, "0"))
              .join("")}`;
            return;
          }
          const view =
            key.iv instanceof Uint8Array
              ? key.iv
              : new Uint8Array(
                  key.iv.buffer,
                  key.iv.byteOffset,
                  key.iv.byteLength,
                );
          iv = `0x${Array.from(view)
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("")}`;
        }
      }
    }

    segments.forEach((segment) => {
      collectKey(segment.key);
    });

    const sessionKeys =
      (parser as any).manifest?.sessionKeys ??
      (parser as any).manifest?.sessionKey ??
      [];
    (Array.isArray(sessionKeys) ? sessionKeys : [sessionKeys]).forEach(
      (key: any) => {
        collectKey(key);
      },
    );

    return {
      methods: Array.from(methods),
      keyUris: Array.from(keyUris),
      iv,
    };
  },
};
