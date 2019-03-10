export async function downloadChunk({ getSegmentURI, key, chunkURI }) {
  const arrayBuffer = await fetch(getSegmentURI(getSegmentURI(chunkURI))).then(
    res => res.arrayBuffer()
  );
  if (key) {
    const decryptData = await decryptChunk({
      keyDataURI: getSegmentURI(key.uri),
      arrayBuffer,
      key
    });
    return new Blob([new Uint8Array(decryptData)]);
  }
  return new Blob([new Uint8Array(arrayBuffer)]);
}

async function decryptChunk({ keyDataURI, arrayBuffer, key }) {
  const keyData = await fetch(keyDataURI).then(res => res.arrayBuffer());
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
      iv: key.iv
    },
    rawKey,
    arrayBuffer
  );
  return decryptData;
}
