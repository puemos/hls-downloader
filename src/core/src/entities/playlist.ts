export class Playlist {
  constructor(
    readonly id: string,
    readonly uri: string,
    readonly index: number,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number,
  ) {}
}
