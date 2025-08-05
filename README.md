# HLS Downloader

![](https://github.com/puemos/hls-downloader/blob/master/src/extension/store-assets/png/Small-Promo-Tile.png?raw=true)

Capture and download [HTTP Live streams (HLS)](https://en.wikipedia.org/wiki/HTTP_Live_Streaming)
from your browser.

This extension is completely free and published under the MIT license.

## Features

- Detects HLS playlists from any tab
- Accepts manual playlist URLs when detection fails
- Lets you pick specific video and audio tracks
- Merges segments into a single MP4 using bundled `ffmpeg.wasm`
- Tracks active and completed downloads in a dedicated tab
- Offers concurrency, retry, and save dialog options
- Works entirely in your browser with no external dependencies

## Get it

### Firefox

[![Firefox](https://blog.mozilla.org/addons/files/2015/11/get-the-addon.png)](https://addons.mozilla.org/en-US/firefox/addon/hls-downloader/)

A signed `extension-firefox.xpi` is available on the [releases page](https://github.com/puemos/hls-downloader/releases) for manual installation.

### Microsoft Edge

[![Microsoft Edge](https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png)](https://microsoftedge.microsoft.com/addons/detail/hls-downloader/ldehhnlpcedapncohebgmghanffggffc)

### Google

Google removed the extension from the Chrome Web Store following a copyright
claim from Globo Comunicação e Participações SA. Chrome and Brave users can
sideload the extension using the `extension-chrome.zip` archive from the
[releases page](https://github.com/puemos/hls-downloader/releases). Extract it
and follow [Install the extension](guides/install-the-extension.md) for
step-by-step instructions.

## Usage

1. Browse to a page that plays an HLS video and start playback.
2. Click the **HLS Downloader** icon and choose a playlist from the **Sniffer**
   tab. If nothing appears, switch to **Direct** and paste the playlist URL.
3. Pick the desired video and audio streams and press **Download**.
4. Monitor progress in the **Downloads** tab. Once merging completes, your
   browser will prompt you to save the file.

## Project structure

The extension is split into multiple packages under `src/`:

```
src/
├── assets          # extension manifest and icons
├── background      # background scripts
├── core            # shared logic and Redux store
├── design-system   # UI component library
└── popup           # React popup UI
```

See [development/architecture.md](development/architecture.md) for a deeper
look at the codebase.

## Build

See [development/build.md](development/build.md) for build and development
instructions.

## License

MIT

