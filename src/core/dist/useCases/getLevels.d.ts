import { Parser } from "../services/Parser";
import { Level } from "../entities/level";
import { Loader } from "../services/Loader";
export declare const getLevelsFactory: (loader: Loader, parser: Parser) => (masterPlaylistURI: string) => Promise<Level[]>;
