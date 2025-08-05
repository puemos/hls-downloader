# HLS Downloader

![Test Coverage](./coverage-badge.svg)

<p align="center">
  <img src="./store-assets/png/Small-Promo-Tile.png?raw=true" height="150" alt="HLS Downloader logo">
</p>
<p align="center">
  <img src="store-assets/jpg/sceenshot-1.jpg?raw=true" height="350" alt="Screenshot of HLS Downloader in action">
</p>

An open-source browser extension to capture and save [HTTP Live Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming) video.

## Features
- Detects active HLS playlists on any page
- Lets you choose audio and video tracks before downloading
- Merges segments into a single MP4 using `ffmpeg.wasm`
- Works on Firefox and Chromium-based browsers

## Table of Contents
- [Installation](#installation)
  - [Firefox](#firefox)
  - [Microsoft Edge](#microsoft-edge)
  - [Chrome](#chrome)
  - [Manual](#manual)
- [Usage](#usage)
- [Build from Source](#build-from-source)
- [Development](#development)
- [Tests](#tests)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Installation

### Firefox
<a href="https://addons.mozilla.org/en-US/firefox/addon/hls-downloader/" target="_blank">
  <img src="https://blog.mozilla.org/addons/files/2015/11/get-the-addon.png" alt="Firefox" height="50px">
</a>

### Microsoft Edge
<a href="https://microsoftedge.microsoft.com/addons/detail/hls-downloader/ldehhnlpcedapncohebgmghanffggffc" target="_blank">
  <img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" alt="Microsoft Edge" height="50px">
</a>

### Chrome
Currently unavailable in the Chrome Web Store following a copyright claim from **Globo Comunicação e Participações SA**.

### Manual
1. Download `hls-downloader-<version>-chromium.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the archive to a folder.
3. Open `chrome://extensions/` in Chrome or another Chromium-based browser.
4. Enable **Developer mode**.
5. Click **Load unpacked** and choose the extracted folder.

## Usage
1. Navigate to a page playing an HLS video.
2. Start playback and click the **HLS Downloader** icon.
3. Pick a playlist from the **Sniffer** tab.
4. Select the streams to grab.
5. Press **Download** and save the generated MP4 when prompted.

## Build from Source
1. Clone the repository.
2. Ensure Node.js and pnpm are installed.
3. Run `pnpm install`.
4. Run `pnpm run build` and ensure it completes without errors.
5. Build artifacts appear in `dist/` along with `extension-chrome.zip` and `extension-firefox.xpi`.

## Development
- `pnpm run dev` starts watch mode and copies built assets to `dist/`.
- `pnpm storybook` launches Storybook for previewing popup and design-system components.

## Tests
- `pnpm test` runs unit tests across all packages.
- `pnpm test:coverage` generates a combined coverage report and updates the badge.

## Project Structure
```text
src/
├── assets          # extension manifest and icons
├── background      # background scripts
├── core            # shared logic and Redux store
├── design-system   # UI component library
└── popup           # React popup UI
```

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md) and additional automation guidelines in [AGENTS.md](./AGENTS.md).

## Code of Conduct
See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License
Licensed under the [MIT License](./LICENSE).

