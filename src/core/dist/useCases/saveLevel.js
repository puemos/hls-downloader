"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const p_queue_1 = require("p-queue");
const getFragmentsDetails_1 = require("./getFragmentsDetails");
const saveFragment_1 = require("./saveFragment");
exports.saveLevelFactory = (config, loader, decryptor, parser, fs) => {
    const getFragmentsDetails = getFragmentsDetails_1.getFragmentsDetailsFactory(loader, parser);
    const saveFragment = saveFragment_1.saveFragmentFactory(loader, decryptor);
    const run = async (level, taskID, onStart, onProgress, onDone) => {
        const queue = new p_queue_1.default({
            concurrency: config.concurrency,
            autoStart: false,
        });
        const bucket = fs.bucket(taskID);
        const fragments = await getFragmentsDetails(level);
        fragments.forEach((fragment) => {
            queue.add(() => saveFragment(fragment, bucket));
        });
        queue.start();
        onStart(fragments.length);
        queue.on("active", () => {
            onProgress();
        });
        await queue.onIdle();
        onDone();
    };
    return run;
};
