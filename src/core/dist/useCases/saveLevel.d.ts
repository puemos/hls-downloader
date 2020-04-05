import { Config } from "../entities/config";
import { Level } from "../entities/level";
import { Decryptor } from "../services/Decryptor";
import { FS } from "../services/FS";
import { Loader } from "../services/Loader";
import { Parser } from "../services/Parser";
export declare const saveLevelFactory: (config: Config, loader: Loader, decryptor: Decryptor, parser: Parser, fs: FS) => (level: Level, taskID: string, onStart: (total: number) => any, onProgress: () => any, onDone: () => any) => Promise<void>;
