import { Fragment } from "../entities/fragment";
import { IDecryptor } from "../services/Decryptor";
import { ILoader } from "../services/Loader";
import { IBucket } from "../services/FS";
import { downloadSingleFragmentFactory } from "../useCases/downloadSingleFragment";
import { decryptSingleFragmentFactory } from "../useCases/decryptSingleFragment";

export const saveFragmentFactory = (loader: ILoader, decryptor: IDecryptor) => {
  const downloadSingleFragment = downloadSingleFragmentFactory(loader);
  const decryptSingleFragment = decryptSingleFragmentFactory(loader, decryptor);

  const run = async (fragment: Fragment, bucket: IBucket): Promise<void> => {
    const data = await downloadSingleFragment(fragment);
    const decryptedData = await decryptSingleFragment(fragment.key, data);
    await bucket.write(String(fragment.index), decryptedData);
  };
  return run;
};
