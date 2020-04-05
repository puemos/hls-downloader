"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const downloadSingleFragment_1 = require("./downloadSingleFragment");
const decryptSingleFragment_1 = require("./decryptSingleFragment");
exports.saveFragmentFactory = (loader, decryptor) => {
    const downloadSingleFragment = downloadSingleFragment_1.downloadSingleFragmentFactory(loader);
    const decryptSingleFragment = decryptSingleFragment_1.decryptSingleFragmentFactory(loader, decryptor);
    const run = async (fragment, bucket) => {
        const data = await downloadSingleFragment(fragment);
        const decryptedData = await decryptSingleFragment(fragment.key, data);
        await bucket.write(String(fragment.index), decryptedData);
    };
    return run;
};
