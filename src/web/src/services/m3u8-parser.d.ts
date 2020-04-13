declare module "m3u8-parser" {
  declare var Parser: Parser;
  interface Parser {
    new (): Parser;
    manifest: Manifest;
    push(chunk: string): void;
  }
  type Segment = {
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

  type Playlist = {
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
    playlists?: Playlist[];
    segments: Segment[];
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
