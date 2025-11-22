export class Playlist {
  constructor(
    readonly id: string,
    readonly uri: string,
    readonly createdAt: number,
    readonly pageTitle?: string,
    readonly initiator?: string,
    readonly tabId?: number,
  ) {}
}
