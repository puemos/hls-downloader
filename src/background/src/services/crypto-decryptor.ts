export async function decrypt(
  data: ArrayBuffer,
  keyData: ArrayBuffer,
  iv: Uint8Array
) {
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
      iv: iv,
    },
    rawKey,
    data
  );
  return decryptData;
}

export const CryptoDecryptor = {
  decrypt,
};
