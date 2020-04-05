import { Fragment } from "../entities/fragment";
import { Loader } from "../services/Loader";
export declare const downloadSingleFragmentFactory: (loader: Loader) => (fragment: Fragment) => Promise<ArrayBuffer>;
