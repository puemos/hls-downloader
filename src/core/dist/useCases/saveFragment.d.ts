import { Fragment } from "../entities/fragment";
import { Decryptor } from "../services/Decryptor";
import { Loader } from "../services/Loader";
import { Bucket } from "../services/FS";
export declare const saveFragmentFactory: (loader: Loader, decryptor: Decryptor) => (fragment: Fragment, bucket: Bucket) => Promise<void>;
