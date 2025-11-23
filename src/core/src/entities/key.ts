export class Key {
  constructor(
    readonly uri?: string | null,
    readonly iv?: Uint8Array | null,
    readonly fallbackUri?: string | null
  ) {}
}
