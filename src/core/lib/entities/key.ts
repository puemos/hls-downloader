export class Key {
    constructor(
      readonly uri?: string,
      readonly iv?: Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer;
      ) {}
  }
  