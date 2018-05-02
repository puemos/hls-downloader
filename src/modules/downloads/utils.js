import * as R from "ramda";

export const playlistFilename = R.pipe(R.split("/"), R.takeLast(2), R.head);

export const joinWithPlaylistURI = playlistURI => uri =>
  R.pipe(R.split("/"), R.dropLast(1), R.append(uri), R.join("/"))(playlistURI);

export const getURIWithPlaylist = playlistURI => {
  return R.ifElse(
    R.startsWith("http"),
    R.identity,
    joinWithPlaylistURI(playlistURI)
  );
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
      console.log("asdasdasd");
      
      return new Blob(blobs, {
        type: "video/mp2t"
      });
    }
  };
}
