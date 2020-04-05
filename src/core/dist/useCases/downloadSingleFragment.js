"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSingleFragmentFactory = (loader) => {
    const run = async (fragment) => {
        const fragmentArrayBuffer = await loader.fetchArrayBuffer(fragment.uri);
        return fragmentArrayBuffer;
    };
    return run;
};
