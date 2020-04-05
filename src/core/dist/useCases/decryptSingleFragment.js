"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSingleFragmentFactory = (loader, decryptor) => {
    const run = async (key, data) => {
        if (!key.uri || !key.iv) {
            return data;
        }
        const keyArrayBuffer = await loader.fetchArrayBuffer(key.uri);
        const decryptedData = decryptor.decrypt(data, keyArrayBuffer, key.iv);
        return decryptedData;
    };
    return run;
};
