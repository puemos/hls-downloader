import { Key } from "../entities/key";

export interface Decryptor {
  decrypt(
    data: ArrayBuffer,
    keyData: ArrayBuffer,
    iv: Uint8Array
  ): Promise<ArrayBuffer>;
}
