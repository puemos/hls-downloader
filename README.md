### Before you fork...

If you are looking for a template, check out this repo: https://github.com/puemos/browser-extension-template

---

<img height="150px" src="./store-assets/png/Small-Promo-Tile.png?raw=true">
<img height="350px" src="store-assets/jpg/sceenshot-1.jpg?raw=true">

<p>Capture and download <a href="https://en.wikipedia.org/wiki/HTTP_Live_Streaming">HTTP Live streams (HLS)</a> from your browser</p>
<p>This extension is completely free and published under the MIT license.</p>
<br><br>

**Table of Contents**

- [Get it](#get-it)
  - [Firefox](#firefox)
  - [Microsoft Edge](#microsoft-edge)
  - [Google](#google)
- [Build](#build)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Contributor Covenant Code of Conduct](#contributor-covenant-code-of-conduct)
- [License](#license)

<br>

## Get it

### Firefox

<a href="https://addons.mozilla.org/en-US/firefox/addon/hls-downloader/" target="_blank">
 <img src="https://blog.mozilla.org/addons/files/2015/11/get-the-addon.png" alt="Firefox" height="50px" >
</a>

### Microsoft Edge

<a href="https://microsoftedge.microsoft.com/addons/detail/hls-downloader/ldehhnlpcedapncohebgmghanffggffc" target="_blank">
 <img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" alt="Microsoft Edge" height="50px" >
</a>

### Google

Google just removed the extension from the store due to a claim

> Globo Comunicação e Participações SA informs that the denounced extension is practicing and/or supporting the practice of illegal activities related to Globo's Copyright Law. This extension allows full and high resolution downloads of Globo content from the Globoplay streaming platform. The disclosure and sale of clandestine services puts the safety of consumers at risk and contributes to organized crime.

## Build

1. Clone the repo
2. Ensure you have Node and npm installed
3. Run `sh ./scripts/build.sh` and verify it completes without errors
4. Built files will be at `./dist/`
5. The zip archive will be in `./extension-archive.zip`

### Development

Run `sh ./scripts/dev.sh` to start watchers for all packages while you edit. The
compiled extension will appear in `dist/` as you work.

## Project Structure

```
src/
├── assets          # extension manifest and icons
├── background      # background scripts
├── core            # shared logic and Redux store
├── design-system   # UI component library
└── popup           # React popup UI
```

## Installation

1. Download the `hls-downloader.crx` file from the latest release (https://github.com/puemos/hls-downloader/releases)
2. Open `chrome://extensions/`
3. Enable `Developer mode`
4. Drop the `hls-downloader.crx` file into the page
5. Enjoy :)

## Usage

1. Browse to a page that plays an HLS video and start playback.
2. Click the **HLS Downloader** icon. Detected playlists will appear in the
   **Sniffer** tab.
3. Choose **Select** next to the playlist you want to download.
4. Pick the desired video and audio streams from the playlist view.
5. Press **Download**. The extension fetches all segments and automatically
   merges them into a single MP4 using the bundled `ffmpeg.wasm`.
6. When processing completes, your browser will prompt you to save the merged
   file.

`ffmpeg` support is bundled with the extension so no external dependencies are
required.

## Contributing

[Contributing guideline](./CONTRIBUTING.md)

Additional automation guidelines can be found in [AGENTS.md](./AGENTS.md).

`TL;DR`

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Contributor Covenant Code of Conduct

[Code of Conduct guideline](./CODE_OF_CONDUCT.md)

## License

The MIT License (MIT)

Copyright (c) 2024 Shy Alter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
