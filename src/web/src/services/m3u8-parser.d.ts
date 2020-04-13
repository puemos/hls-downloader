declare module "m3u8-parser" {
  var Parser: M3U8Parser;
  interface M3U8Parser {
    new (): M3U8Parser;
    manifest: Manifest;
    push(chunk: string): void;
  }
  type M3U8Segment = {
    byterange: {
      length: number;
      offset: number;
    };
    duration: number;
    attributes: {};
    discontinuity: number;
    uri: string;
    timeline: number;
    key: {
      method: string;
      uri: string;
      iv: Uint8Array;
    };
    map: {
      uri: string;
      byterange: {
        length: number;
        offset: number;
      };
    };
    "cue-out": string;
    "cue-out-cont": string;
    "cue-in": string;
    custom: {};
  };

  type M3U8Playlist = {
    uri: string;
    attributes: {
      "PROGRAM-ID"?: number;
      BANDWIDTH?: number;
      RESOLUTION?: {
        width: number;
        height: number;
      };
    };
  };

  interface Manifest {
    allowCache: boolean;
    endList: boolean;
    mediaSequence: number;
    discontinuitySequence: number;
    playlistType: string;
    custom: {};
    playlists?: M3U8Playlist[];
    segments: M3U8Segment[];
    mediaGroups: {
      AUDIO: {
        "GROUP-ID": {
          NAME: {
            default: boolean;
            autoselect: boolean;
            language: string;
            uri: string;
            instreamId: string;
            characteristics: string;
            forced: boolean;
          };
        };
      };
      VIDEO: {};
      "CLOSED-CAPTIONS": {};
      SUBTITLES: {};
    };
    dateTimeString: string;
    dateTimeObject: Date;
    targetDuration: number;
    totalDuration: number;
    discontinuityStarts: number[];
  }
}
