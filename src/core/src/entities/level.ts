export class Level {
  constructor(
    readonly id: string,
    readonly playlistID: string,
    readonly uri: string,
    readonly index: number,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number,
  ) {}
}
