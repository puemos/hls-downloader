import * as Comlink from "comlink";

export interface IMergeWorker {
  merge(store: Record<string, Uint8Array>, length: number): Uint8Array;
}

const MergeWorker: IMergeWorker = {
  merge(store: Record<string, Uint8Array>, length: number) {
    const totalLength = Object.values(store).reduce(
      (prev, curr) => prev + curr.length,
      0
    );
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (let index = 0; index < length; index++) {
      const arr = store[index];
      result.set(arr, offset);
      offset += arr.byteLength;
    }

    return result;
  },
};

Comlink.expose(MergeWorker);
