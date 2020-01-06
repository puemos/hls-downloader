import * as R from "ramda";
import resolveUrl from "@videojs/vhs-utils/dist/resolve-url";

export const playlistFilename = R.pipe(
  R.split("/"),
  R.takeLast(1),
  R.head,
  R.split(".m3u8"),
  R.head
);

export const joinWithURI = base => (uri = "") => resolveUrl(base, uri);

export const getURI = base => joinWithURI(base);

export function BlobBuilder() {
  const blobs = [];
  let count = 0;
  return {
    add: (index, blob) => {
      blobs[index] = blob;
      count = count + 1;
    },
    count: () => {
      return count;
    },
    build: () => {
      return new Blob(blobs, {
        type: "video/mp2t"
      });
    }
  };
}
