import * as R from "ramda";

export const playlistFilename = R.pipe(
  R.split("/"),
  R.takeLast(1),
  R.head,
  R.split(".m3u8"),
  R.head
);

export const joinWithURI = base => uri =>
  R.pipe(
    i => new URL(i),
    i => i.protocol + "//" + i.host + i.pathname,
    R.split("/"),
    R.dropLast(1),
    R.append(uri),
    R.join("/")
  )(base);

export const getURI = base => {
  return R.ifElse(R.startsWith("http"), R.identity, joinWithURI(base));
};

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
