<!-- markdownlint-disable MD041 -->
<h1 align="center">HLS Downloader</h1>

<p align="center">
  Capture and download <a href="https://en.wikipedia.org/wiki/HTTP_Live_Streaming">HTTP Live Streams (HLS)</a> straight from your browser.<br>
  <strong>Free&nbsp;•&nbsp;Open&nbsp;Source&nbsp;•&nbsp;MIT Licensed</strong>
</p>

<p align="center">
  <img alt="Test Coverage" src="./coverage-badge.svg">
</p>

<p align="center">
  <img alt="Extension promo tile" src="./store-assets/png/Small-Promo-Tile.png?raw=true" height="150">
</p>

<p align="center">
  <img alt="Popup screenshot" src="store-assets/jpg/sceenshot-1.jpg?raw=true" height="350">
</p>

---

## ✨ Features

* **Automatic stream discovery**
  Detects HLS playlists on the page the moment you open it. No DevTools sniffing required.
* **Fine-grained quality control**
  Pick any combination of video resolution (240p → 4K) and audio language/bit-rate *before* you download, so you never waste bandwidth on the wrong track.
* **100% local merge with `ffmpeg.wasm`**
  A WebAssembly build of FFmpeg runs right inside your tab, muxing the chosen audio + video into a single MP4.
  * Nothing is uploaded, keeping your files private.
* **Works everywhere you browse**  
  Verified on Firefox, Edge, Chrome, Brave, Vivaldi, Arc, and other Chromium-based browsers, on Windows, macOS, and Linux.

---

## 📦 Get It

| Browser | Download / availability |
| :-- | :-- |
| Firefox | [<img src="https://blog.mozilla.org/addons/files/2015/11/get-the-addon.png" height="50" alt="Get it for Firefox">](https://addons.mozilla.org/en-US/firefox/addon/hls-downloader/) |
| Microsoft Edge | [<img src="https://developer.microsoft.com/store/badges/images/English_get-it-from-MS.png" height="50" alt="Get it for Edge">](https://microsoftedge.microsoft.com/addons/detail/hls-downloader/ldehhnlpcedapncohebgmghanffggffc) |
| Google Chrome | [Use manual installation](#installation) since: <br><br> <blockquote>Google removed the extension from the Chrome Web Store after a copyright complaint by <em>Globo Comunicação e Participações SA</em>.</blockquote> |


<sup>\*For Chrome/Brave/Vivaldi/etc. download the ZIP from the latest release and follow the manual-install steps below.</sup>

---

## 🛠️ Installation

### Chromium browsers (Chrome, Brave, Vivaldi …)

> **Newer versions (≥ 4.1.2)** ship only a ZIP archive.
> Older versions can still be installed from the CRX – see the collapsible notes.

1. Download `extension-chrome.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the ZIP to a convenient folder.
3. Open `chrome://extensions/` and enable **Developer mode** (top-right switch).
4. Click **Load unpacked** and select the **extracted folder** (the one that contains `manifest.json`).
5. Enjoy 🎉

<details>
<summary>Manual install for versions < 4.1.2 (CRX)</summary>

1. Grab `hls-downloader.crx` from the corresponding legacy release.
2. Open `chrome://extensions/`, enable **Developer mode**.
3. Drag-and-drop the CRX onto the extensions page.
4. Confirm any prompts.

</details>

### Firefox (temporary or permanent)

**Option A – Temporary (for testing)**

1. Download `extension-firefox.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases) and extract it.
2. Navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**, browse into the extracted folder, and select `manifest.json`.
4. The add-on will stay active until you restart the browser.

**Option B – Permanent **

1. In **Add-ons Manager** (`about:addons`) choose the gear icon
2. Click on **Install Add-on From File…** and pick the XPI.

---

## 🎬 Usage

1. Browse to a page that plays an HLS video and start playback.
2. Click the **HLS Downloader** icon – detected playlists appear in the **Sniffer** tab.
3. Choose **Select** next to a playlist.
4. Pick your video & audio streams, then press **Download**.
5. Grab a coffee ☕ – `ffmpeg.wasm` merges everything and your browser prompts you to save the MP4 when done.

---

## 🧑‍💻 Development

### Clone & Build

```bash
git clone https://github.com/puemos/hls-downloader.git
cd hls-downloader
pnpm install
pnpm build        # output → ./dist/
```

```bash
# - Bundled archives: `extension-chrome.zip`, `extension-firefox.zip`
# - Run tests & generate coverage badge:
```

```bash
pnpm test          # unit tests
pnpm test:coverage # combined coverage + badge
```

### Live Development

```bash
pnpm dev        # watches & rebuilds into dist/
pnpm storybook  # preview popup & design-system components
```

### Project Structure

```text
src/
├─ assets/          # extension manifest & icons
├─ background/      # background scripts
├─ core/            # shared logic & Redux store
├─ design-system/   # UI component library
└─ popup/           # React popup UI
```

---

## 🤝 Contributing

We ♥ PRs! See the [contributing guide](./CONTRIBUTING.md) and [automation guide](./AGENTS.md).

```bash
git checkout -b feature/my-awesome-idea
# ...code...
git commit -am "feat: add awesome idea"
git push origin feature/my-awesome-idea
# open PR 🎉
```

---

## 📜 Code of Conduct

**TLDR: Be kind**
This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

---

## 📝 License

<details>
<summary>MIT License – click to expand</summary>

```text
The MIT License (MIT)

Copyright (c) 2025 Shy Alter

More: https://github.com/puemos/hls-downloader/blob/master/LICENSE
```

</details>

---

<p align="center">
  <em>Made with ♥ by <a href="https://github.com/puemos">puemos</a></em>
</p>
