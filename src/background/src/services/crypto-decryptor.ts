export async function decrypt(
  data: ArrayBuffer,
  keyData: ArrayBuffer,
  iv: Uint8Array
) {
  const decryptIv = new Uint8Array(iv.byteLength);
  decryptIv.set(iv);
  const rawKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    "aes-cbc",
    false,
    ["decrypt"]
  );
  const decryptData = await crypto.subtle.decrypt(
    {
      name: "aes-cbc",
      iv: decryptIv,
    },
    rawKey,
    data
  );
  return decryptData;
}

export const CryptoDecryptor = {
  decrypt,
};
