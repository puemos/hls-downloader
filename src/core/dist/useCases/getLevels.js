"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevelsFactory = (loader, parser) => {
    const run = async (masterPlaylistURI) => {
        const masterPlaylistText = await loader.fetchText(masterPlaylistURI);
        return parser.parseMasterPlaylist(masterPlaylistText, masterPlaylistURI);
    };
    return run;
};
