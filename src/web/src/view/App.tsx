import React from "react";

import { saveLevelFactory } from "core/dist/useCases/saveLevel";
import { HlsParser } from "../services/HlsParser";
import { Fetch } from "../services/Fetch";
import { CryptoDecryptor } from "../services/CryptoDecryptor";
import { InMemoryFS } from "../services/InMemoryFS";

const saveLevel = saveLevelFactory(
  { concurrency: 2 },
  Fetch,
  CryptoDecryptor,
  HlsParser,
  InMemoryFS
);
let total = 0;
let done = 0;
saveLevel(
  {
    index: 0,
    uri: "https://bitdash-a.akamaihd.net/content/sintel/hls/video/250kbit.m3u8",
    width: 422,
    height: 180,
    bitrate: 258157,
  },
  "1",
  (t) => {
    total = t;
  },
  () => {
    done++;
    console.log("onProgress: ", done / total);
  },
  () => console.log("Done")
);

function App() {
  return <div className="App"></div>;
}

export default App;
