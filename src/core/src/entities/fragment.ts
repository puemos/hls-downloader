import { Key } from "./key";

export class Fragment {
  constructor(
    readonly key: Key,
    readonly uri: string,
    readonly index: number
  ) {}
}
