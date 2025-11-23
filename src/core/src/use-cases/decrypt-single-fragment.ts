import { Key } from "../entities";
import { IDecryptor, ILoader } from "../services";
import { fetchWithFallback } from "../utils/fetch";

export const decryptSingleFragmentFactory = (
  loader: ILoader,
  decryptor: IDecryptor
) => {
  const run = async (
    key: Key,
    data: ArrayBuffer,
    fetchAttempts: number
  ): Promise<ArrayBuffer> => {
    if (!key.uri || !key.iv) {
      return data;
    }
    const { data: keyArrayBuffer } = await fetchWithFallback(
      key.uri,
      key.fallbackUri,
      fetchAttempts,
      loader.fetchArrayBuffer
    );
    const decryptedData = await decryptor.decrypt(data, keyArrayBuffer, key.iv);
    return decryptedData;
  };
  return run;
};
