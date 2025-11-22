export type LevelType = "stream" | "audio" | "subtitle";

export class Level {
  constructor(
    readonly type: LevelType,
    readonly id: string,
    readonly playlistID: string,
    readonly uri: string,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number,
    readonly fps?: number,
    readonly language?: string,
    readonly name?: string,
    readonly characteristics?: string,
    readonly instreamId?: string,
    readonly channels?: string,
  ) {}
}
