import * as R from "ramda";

export const urlnameParse = R.pipe(
  R.split(".m3u8"),
  R.nth(0),
  R.split("/"),
  R.last
);
