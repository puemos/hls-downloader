import { Key } from "./key";

export type ByteRange = { offset: number; length: number };

export class Fragment {
  constructor(
    readonly key: Key,
    readonly uri: string,
    readonly index: number,
    readonly fallbackUri?: string | null,
    readonly byteRange?: ByteRange | null
  ) {}
}
