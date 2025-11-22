import { Fragment } from "./fragment";

export class Job {
  constructor(
    readonly id: string,
    readonly videoFragments: Fragment[],
    readonly audioFragments: Fragment[],
    readonly filename: string,
    readonly createdAt: number,
    readonly width?: number,
    readonly height?: number,
    readonly bitrate?: number,
    readonly link?: string,
    readonly subtitleText?: string,
    readonly subtitleLanguage?: string,
    readonly subtitleName?: string,
  ) {}
}
