import { createStore } from "core/dist/adapters/redux/configureStore";
import { downloadsSlice } from "core/dist/adapters/redux/downloads/downloadsSlice";
import { CryptoDecryptor } from "./services/CryptoDecryptor";
import { Fetch } from "./services/Fetch";
import { HlsParser } from "./services/HlsParser";
import { LocalFS } from "./services/LocalFS";
import { askDetails } from "./inquirer";

const store = createStore({
  config: { concurrency: 2 },
  decryptor: CryptoDecryptor,
  fs: LocalFS,
  loader: Fetch,
  parser: HlsParser,
});

const run = async () => {
  const detail = await askDetails();
  console.log(detail.url, detail.output);
  store.dispatch(
    downloadsSlice.actions.downloadPlaylist({
      playlist: {
        id: detail.output,
        index: 0,
        uri: detail.url,
        width: 422,
        height: 180,
        bitrate: 258157,
      },
    })
  );
};
// https://bitdash-a.akamaihd.net/content/sintel/hls/video/250kbit.m3u8
run();
