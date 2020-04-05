"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFragmentsDetailsFactory = (loader, parser) => {
    const run = async (level) => {
        const levelPlaylistText = await loader.fetchText(level.uri);
        return parser.parseLevelPlaylist(levelPlaylistText, level.uri, level.index);
    };
    return run;
};
