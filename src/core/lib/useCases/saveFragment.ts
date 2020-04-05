import { Fragment } from "../entities/fragment";
import { Decryptor } from "../services/Decryptor";
import { Loader } from "../services/Loader";
import { Bucket } from "../services/FS";
import { downloadSingleFragmentFactory } from "./downloadSingleFragment";
import { decryptSingleFragmentFactory } from "./decryptSingleFragment";

export const saveFragmentFactory = (loader: Loader, decryptor: Decryptor) => {
  const downloadSingleFragment = downloadSingleFragmentFactory(loader);
  const decryptSingleFragment = decryptSingleFragmentFactory(loader, decryptor);

  const run = async (fragment: Fragment, bucket: Bucket): Promise<void> => {
    const data = await downloadSingleFragment(fragment);
    const decryptedData = await decryptSingleFragment(fragment.key, data);
    await bucket.write(String(fragment.index), decryptedData);
  };
  return run;
};
