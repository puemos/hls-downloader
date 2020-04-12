export class Playlist {
  constructor(
    readonly id: string,
    readonly uri: string,
    readonly width: number,
    readonly height: number,
    readonly bitrate: number,
    readonly index: number
  ) {}
}
