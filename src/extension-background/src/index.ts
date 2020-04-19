import "webextension-polyfill";
import { CryptoDecryptor } from "./services/crypto-decryptor";
import { InMemoryFS } from "./services/in-memory-fs";
import { FetchLoader } from "./services/fetch-loader";
import { M3u8Parser } from "./services/m3u8-parser";
import { createStore } from "@hls-downloader/core/lib/adapters/redux/configure-store";
import { wrapStore } from "webext-redux";

const store = createStore({
  decryptor: CryptoDecryptor,
  fs: InMemoryFS,
  loader: FetchLoader,
  parser: M3u8Parser,
});

wrapStore(store);
