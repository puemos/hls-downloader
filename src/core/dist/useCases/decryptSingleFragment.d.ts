import { Decryptor } from "../services/Decryptor";
import { Loader } from "../services/Loader";
import { Key } from "../entities/key";
export declare const decryptSingleFragmentFactory: (loader: Loader, decryptor: Decryptor) => (key: Key, data: ArrayBuffer) => Promise<ArrayBuffer>;
