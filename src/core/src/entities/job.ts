import { Fragment } from "./fragment";

export class Job {
  constructor(
    readonly id: string,
    readonly fragments: Fragment[],
    readonly filename: string,
    readonly createdAt: number,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number
  ) {}
}
