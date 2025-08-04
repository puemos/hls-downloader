export interface IDecryptor {
  decrypt(
    data: ArrayBuffer,
    keyData: ArrayBuffer,
    iv: Uint8Array
  ): Promise<ArrayBuffer>;
}
