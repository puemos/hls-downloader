export type LevelType = "stream" | "audio";

export class Level {
  constructor(
    readonly type: LevelType,
    readonly id: string,
    readonly playlistID: string,
    readonly uri: string,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number,
    readonly fps?: number
  ) {}
}
