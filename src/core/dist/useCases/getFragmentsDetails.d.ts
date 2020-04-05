import { Parser } from "../services/Parser";
import { Level } from "../entities/level";
import { Fragment } from "../entities/fragment";
import { Loader } from "../services/Loader";
export declare const getFragmentsDetailsFactory: (loader: Loader, parser: Parser) => (level: Level) => Promise<Fragment[]>;
