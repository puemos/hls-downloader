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

## 📖 Table of Contents

- [Features](#-features)
- [Get It](#-get-it)
- [Installation](#️-installation)
- [Usage](#-usage)
- [Development](#-development)
- [Contribution](#-contributing)
- [Code of Conduct](#-code-of-conduct)
- [License](#-license)

## ✨ Features

- **Automatic stream discovery**
  Detects HLS playlists on the page the moment you open it. No DevTools sniffing required.
- **Fine-grained quality control**
  Pick any combination of video resolution (240p → 4K) and audio language/bit-rate _before_ you download, so you never waste bandwidth on the wrong track.
- **100% local, disk-backed merge with `ffmpeg.wasm`**
  A WebAssembly build of FFmpeg muxes the chosen audio + video into a standard MP4 or MKV while keeping media fragments and final output in browser-managed storage.
  * Nothing is uploaded, keeping your files private.
- **Works everywhere you browse**
  Verified on Firefox, Edge, Chrome, Brave, Arc, and other Chromium-based browsers, on Windows, macOS, and Linux.

---

## 📦 Get It

| Browser                                                                                                                                                                    | Download / availability                                                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" height="14" alt="Google Chrome logo" />&nbsp;&nbsp;Google Chrome | Experimental MV3 build available from source (see Development section).                                                             |
| <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" height="14" alt="Firefox logo" />&nbsp;&nbsp;Firefox                               | [Get it on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/hls-downloader/) or [use manual installation](#-firefox) |
| <img src="https://upload.wikimedia.org/wikipedia/commons/9/98/Microsoft_Edge_logo_%282019%29.svg" height="14" alt="Microsoft Edge logo" />&nbsp;&nbsp;Microsoft Edge       | [Get it from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/hls-downloader/ldehhnlpcedapncohebgmghanffggffc)       |
| <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Brave_lion_icon.svg" height="14" alt="Brave logo" />&nbsp;&nbsp;Brave                                        | [Use manual installation](#-brave)                                                                                                  |
| <img src="https://upload.wikimedia.org/wikipedia/commons/3/37/Arc_%28browser%29_logo.svg" height="14" alt="Arc logo" />&nbsp;&nbsp;Arc                                     | [Use manual installation](#-arc)                                                                                                    |
| <img src="https://upload.wikimedia.org/wikipedia/commons/4/49/Opera_2015_icon.svg" height="14" alt="Opera logo" />&nbsp;&nbsp;Opera                                        | [Use manual installation](#-opera)                                                                                                  |

<sup>*For Brave/Arc/etc. download the ZIP from the [latest release](https://github.com/puemos/hls-downloader/releases) and follow the manual-install steps below.</sup>

Current releases require Firefox 128 or newer, or Chromium 111 or newer.

---

## 🛠️ Installation

> **Newer versions (≥ 4.1.2)** ship only a ZIP archive.  
> Older versions can still be installed from the CRX (see the collapsible notes).

<details>
<summary>Manual install for versions &lt; 4.1.2 (CRX)</summary>

1. Grab `hls-downloader.crx` from the corresponding legacy release.
2. Open `chrome://extensions/`, enable **Developer mode**.
3. Drag and drop the CRX onto the extensions page.
4. Confirm any prompts.

</details>

### <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg" height="14" alt="Google Chrome logo" /> Chrome

1. Download `extension-mv3-chrome.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the ZIP to a convenient folder.
3. Open `chrome://extensions/` and enable **Developer mode**.
4. Click **Load unpacked** and select the **extracted folder** (the one that contains `manifest.json`).
5. Enjoy 🎉

### <img src="https://upload.wikimedia.org/wikipedia/commons/9/9d/Brave_lion_icon.svg" height="14" alt="Brave logo" /> Brave

1. Download `extension-mv3-chrome.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the ZIP to a convenient folder.
3. Open `brave://extensions/` and enable **Developer mode**.
4. Click **Load unpacked** and select the **extracted folder** (the one that contains `manifest.json`).
5. Enjoy 🎉

### <img src="https://upload.wikimedia.org/wikipedia/commons/3/37/Arc_%28browser%29_logo.svg" height="14" alt="Arc logo" /> Arc

1. Download `extension-mv3-chrome.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the ZIP to a convenient folder.
3. Open **Arc Menu → Extensions → Manage Extensions** (or press **Command+T** or **Ctrl+T** and type **Manage Extensions**), then enable **Developer mode**.
4. Click **Load unpacked** and select the **extracted folder** (the one that contains `manifest.json`).
5. Enjoy 🎉

### <img src="https://upload.wikimedia.org/wikipedia/commons/4/49/Opera_2015_icon.svg" height="14" alt="Opera logo" /> Opera

1. Download `extension-mv3-chrome.zip` from the [latest release](https://github.com/puemos/hls-downloader/releases).
2. Extract the ZIP to a convenient folder.
3. Open `opera://extensions/` and enable **Developer mode**.
4. Click **Load unpacked** and select the **extracted folder** (the one that contains `manifest.json`).
5. Enjoy 🎉

### <img src="https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg" height="14" alt="Firefox logo" /> Firefox

1. Opem `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...** and pick the XPI.

[For Dear Testers](./FOR-DEAR-TESTERS.md) – concise build/install steps for Firefox & Chromium reviewers.

---

## 🎬 Usage

1. Browse to a page that plays an HLS video and start playback.
2. Click the **HLS Downloader** icon – detected playlists appear in the **Sniffer** tab.
3. Choose **Select** next to a playlist.
4. Pick your video & audio streams, then press **Download**.
5. Grab a coffee ☕ – `ffmpeg.wasm` merges everything and your browser prompts you to save the MP4 when done.

The extension needs enough free disk space for both the downloaded fragments
and the finalized media file. Browser storage estimates can be conservative and
are treated as informational when unlimited storage permission is active.
Downloads started by an older extension version remain readable through the
legacy IndexedDB path, but are not migrated; if a legacy finalization runs out
of memory, delete it and download it again.

---

## 🧑‍💻 Development

### Clone & Build

Requires Node.js 22.23.4+ and the `zip` command. Firefox release builds use
Node.js 22.23.4, npm 10.9.9, and pnpm 12.16.1 exactly.

```bash
git clone https://github.com/puemos/hls-downloader.git
cd hls-downloader

# install the pinned pnpm version through npm
npm install --global pnpm@12.16.1

pnpm install --frozen-lockfile
pnpm run build    # outputs → ./dist/, extension-chrome.zip, extension-firefox.xpi

# verify build artifacts then clean up
pnpm run clean
```

**MV2 vs MV3 builds**

The default build targets Manifest V2 (Firefox and legacy Chromium workflows). To produce a Manifest V3 bundle for Chromium-based browsers (Firefox does not fully support MV3 background service workers yet):

```bash
MV_TARGET=mv3 pnpm run build   # writes manifest v3 + offscreen page to dist/
pnpm run clean                 # optional: remove artifacts after testing
```

You can generate both flavors at once with pre-named artifacts:

```bash
pnpm run build:all          # outputs dist/mv2 + dist/mv3
# zips: extension-mv2-chrome.zip / extension-mv2-firefox.xpi  (MV2 contents at archive root)
#       extension-mv3-chrome.zip                            (MV3 contents at archive root; Chromium only)
```

For Firefox Add-ons source review, use the exact reproduction steps in
[AMO_SOURCE_REVIEW.md](./AMO_SOURCE_REVIEW.md). Do not upload a stale local
`source-code.zip`; `pnpm run publish:firefox` creates a fresh source archive from
the committed release revision.

> Tip: If pnpm is missing, run `npm install --global pnpm@12.16.1` to match the locked toolchain.

Run tests & generate coverage badge:

```bash
pnpm test          # unit tests
pnpm test:coverage # combined coverage + badge
```

Check dependency advisories and the installed security fixes:

```bash
pnpm run security:audit
```

The workspace uses pnpm's default release-age protections and explicitly disables
esbuild's install script. The Firefox lint tool's `deepmerge@4.3.1` dependency has
a committed patch for [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
The audit still reports this low-severity advisory because upstream has not
published a fixed version. The security check exercises the installed patch
against prototype-poisoning regressions and verifies merge compatibility; it
also rejects moderate, high, and critical dependency advisories, with the guarded
legacy exception below.

Modern glob and minimatch consumers use patched releases. The broad version
range in [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
also flags minimatch 3, which predates the vulnerable optimization phase added
in version 7. A documented audit exception preserves that legacy CommonJS API.
The verifier rejects any lockfile version other than the inspected legacy
branch and the patched modern release, and checks that legacy patterns do not
enter the amplification phase. It also verifies that cancelled glob traversal
performs no directory reads.

Run the local browser e2e smoke test:

```bash
pnpm test:e2e:local
```

This builds the MV3 extension, launches Brave on macOS with the unpacked
extension, opens a real online HLS stream with audio/video/WebVTT subtitles,
verifies Sniffer, preview, playlist selection, download, and saved `.mkv`
or equivalent media-container output, then removes generated extension
artifacts. The downloaded media file stays in a temp directory and the script
prints its path so you can review it manually. It is intentionally not part of
CI and skips when `CI=true`. Set `E2E_BROWSER=/path/to/Brave Browser` for a
custom Brave binary path, `E2E_HLS_URL=https://.../playlist.m3u8` to override
the stream, or `E2E_CLEAN_DOWNLOAD=1` to delete the downloaded file after the
run.

Run the local job preparation and recovery regression:

```bash
pnpm test:e2e:preparation
```

This installs published v5.5.11 and the candidate in fresh Brave MV3 and
Firefox MV2 profiles. A local HTTP server serves real H.264/AAC streams and
injects video/audio/caption manifest failures, empty selected media playlists,
and stalled manifest bodies after Start download. Recovery cases require a
visible error and a successful Retry. Each cancellation case cancels six
stalled preparations before saving a new complete download.

Every candidate file is fully decoded and compared with all source video
frames, complete audio hashes, and caption text/timing. Controls cover TS,
fMP4, AES-128 media and captions, empty WebVTT, MKV, direct audio-only streams,
and redirected playlists. Requires macOS, Brave, Firefox, FFmpeg/FFprobe,
and GitHub CLI. The script downloads its pinned geckodriver or accepts
`E2E_GECKODRIVER`. Use `E2E_PREPARATION_BROWSERS=brave` or `firefox`,
`E2E_BASELINE_ONLY=1`, `E2E_SKIP_BASELINE=1`, or
`E2E_PREPARATION_CASES=fail-video,empty-audio,cancel-caption` to narrow a run.
Logs, request records, JSON results, and saved files remain in the printed
temporary directory. Remove generated build outputs after verification.

Run the local redirected-playlist and single-use caption regression:

```bash
pnpm test:e2e:redirects
```

This compares published v5.5.10 with the candidate in fresh Brave MV3 and
Firefox MV2 profiles. Two local HTTP servers serve real H.264/AAC streams with
master and media-playlist redirects, redirect chains, cross-origin redirects,
replaced authentication tokens, AES-128 TS/fMP4 inputs, initialization maps,
and byte-range media. Caption cases include redirected HLS playlists and direct
WebVTT URLs that expire after one read. Controls cover ordinary TS/fMP4,
encryption, captions, and MKV output.

Every fixed saved file is fully decoded and checked against all source video
frames, the complete audio hash, and caption text and timing. Requires macOS,
Brave, Firefox, FFmpeg/FFprobe, and GitHub CLI. The script downloads its pinned
geckodriver or accepts `E2E_GECKODRIVER`. Use `E2E_REDIRECT_BROWSERS=brave` or
`firefox`, `E2E_BASELINE_ONLY=1`, `E2E_SKIP_BASELINE=1`, or
`E2E_REDIRECT_CASES=master-302,encrypted-fmp4,caption-once` to narrow a run.
Logs, request records, JSON results, and actual saved files remain in the
printed temporary directory. Remove generated build outputs after verification.

Run the local saved-media integrity regression:

```bash
pnpm test:e2e:integrity
```

This generates real H.264 streams with unequal video/audio durations, separate
AAC/AC-3/E-AC-3/MP3 audio, and byte-range fMP4 media. It compares published
v5.5.9 against the candidate in fresh Brave MV3 and Firefox MV2 profiles.
The HTTP server injects truncated or wrongly positioned range responses.
Every fixed saved file is fully decoded and compared with all source video
frames and the complete decoded audio hash. Controls cover AAC, ignored Range
headers, MKV output, and WebVTT captions.

Requires macOS, Brave, Firefox, FFmpeg/FFprobe, and GitHub CLI. The script
downloads its pinned geckodriver or accepts `E2E_GECKODRIVER`. Use
`E2E_INTEGRITY_BROWSERS=brave` or `firefox`, `E2E_BASELINE_ONLY=1`,
`E2E_SKIP_BASELINE=1`, or `E2E_INTEGRITY_CASES=short-audio,ac3,range-short`
to narrow a run. Logs, request records, JSON results, and actual saved files
remain in the printed temporary directory. Remove build outputs after checking
packaging; browser profiles and processes are cleaned up automatically.

Run the local playlist and encrypted-caption regression:

```bash
pnpm test:e2e:playlists
```

This installs published v5.5.8 builds and the candidate in fresh Brave MV3 and
Firefox MV2 profiles. It tests actual capture of extensionless, `.m3u`, and
unusually typed HLS responses; direct TS/fMP4/audio-only media playlists; and
AES-128 WebVTT captions with implicit/explicit IVs, key rotation, clear lead-ins,
and byte ranges. The old caption failure is detected by inspecting the saved
file even when the extension reports completion. Fixed files are fully decoded
and compared with source frames, audio hashes, and caption text/timing.

Requires macOS, Brave, Firefox, FFmpeg/FFprobe, and GitHub CLI. The script
downloads its pinned geckodriver or accepts `E2E_GECKODRIVER`. Use
`E2E_PLAYLIST_BROWSERS=brave` or `firefox`, `E2E_BASELINE_ONLY=1`, or
`E2E_PLAYLIST_CASES=direct-ts,captions-rotation` to narrow a run.
Logs, JSON results, and saved media remain in the printed temporary directory.
Profiles and processes are cleaned up; remove generated build outputs after
verification.

Run the local network and job recovery regression:

```bash
pnpm test:e2e:network
```

This generates real H.264/AAC HLS streams, installs the published v5.5.7 build
and the candidate in isolated Brave MV3 and Firefox MV2 profiles, and exercises
temporary HTTP errors, interrupted connections, stalled response bodies,
encryption-key recovery, cancellation, and storage initialization failures.
Controls cover real byte-range media and active transfers lasting more than
30 seconds without timing out.
Each cancellation case cancels six stalled jobs before completing a new download.
Every successful saved file is fully decoded and checked against source video
frames, audio hashes, and subtitle cues. Logs, request timestamps, JSON results,
and saved media remain in the printed temporary directory.

Requires macOS with Brave, Firefox, FFmpeg, FFprobe, and GitHub CLI available.
The script downloads the pinned geckodriver automatically, or accepts
`E2E_GECKODRIVER=/path/to/geckodriver`. Use `E2E_NETWORK_BROWSERS=brave` or
`firefox` to select one browser, `E2E_BASELINE_ONLY=1` to reproduce the released
bugs, and `E2E_NETWORK_CASES=503,stall,cancel,storage` to select fault cases.
Build outputs remain available for subsequent packaging checks and should be
removed after verification. Browser profiles and processes are cleaned up.

Run the local AES-128 browser regression with generated media:

```bash
pnpm test:e2e:aes128
```

This macOS test needs Brave, Firefox, `ffmpeg` with H.264/AAC encoders,
`ffprobe`, `gh`, `unzip`, and `tar`. It downloads the known failing v5.5.3
release and Mozilla's GeckoDriver, builds the current extensions, and uses
temporary browser profiles to download real encrypted HLS through the UI.
It covers encrypted TS, a clear lead-in followed by encrypted segments, and
encrypted fMP4 with a separate initialization key. It requires the old release
to fail, decodes each saved file, compares every video frame with the source,
checks the full audio/video duration, and matches decoded audio against the
unencrypted browser control. CMAF cases exercise downloading without the
separate hls.js preview. Evidence
and saved media stay in the printed temporary directory; extension build
artifacts are removed. It skips in CI. Use `E2E_AES128_BROWSERS=brave` or
`E2E_AES128_BROWSERS=firefox` to run one browser, and `E2E_GECKODRIVER=/path/to/geckodriver`
to use an existing driver.

The AES-128 matrix downloads video and separate audio. Set
`E2E_AES128_SUBTITLES=1` to additionally select WebVTT subtitles and apply the
same complete-file checks. A "Completed" download with missing frames fails
the test.

Run the WebVTT truncation regression:

```bash
pnpm test:e2e:subtitles
```

This reproduces saved-but-truncated files in v5.5.5 and checks the current
extension with short, sparse, and empty captions in Brave MV3 and Firefox MV2.
It covers clear and encrypted TS/fMP4 streams. Every saved video frame must
match the source, full decoded audio must match the source HLS hash, and
extracted subtitle cues and timing must match the input. It uses the same
dependencies and browser selection options as `test:e2e:aes128`. Use
`E2E_BASELINE_ONLY=1 pnpm test:e2e:subtitles` to reproduce only the old release's
failures without building the current extension. Saved media and JSON results
remain in the printed temporary evidence directory.

Run the audio-only primary-playlist regression with the same real browser harness:

```bash
pnpm test:e2e:audio
```

This uses AAC-only TS and fMP4 primary playlists, including encrypted variants.
It reproduces the save failure in v5.5.4, then requires the current extension
to save complete audio with no unexpected streams. Decoded audio must match
the source HLS stream exactly. An alternate-audio case uses a different tone
and requires the selected track to be saved. It uses the same dependencies and browser
selection options as `test:e2e:aes128`.

Run the MKV filename and MIME regression:

```bash
pnpm test:e2e:mkv
```

This also requires Docker. It builds an isolated Linux x64 Chrome 128 image
from Google's pinned Chrome for Testing archive; ARM hosts need Docker's x64
emulation. That supported older browser reproduces MKV downloads becoming TXT,
which current browsers' built-in Matroska mappings can mask. The test downloads
the original v5.5.0 and v5.5.6 no-blocklist releases, checks the current standard
and no-blocklist variants, and includes MP4 and subtitle controls. On macOS it
also runs the installed Brave and Firefox. Use `E2E_MKV_BROWSERS=chrome128` to
run only the Docker cases.

The test uses the browser's normal download handling and verifies the actual
saved filename, reported MIME type, container header, complete decoded video
and audio, and selected subtitles. Generated extension artifacts are removed;
saved media and JSON evidence remain in the printed temporary directory.
Containers and their test profiles are removed after each case. The reusable
Docker image is named `hls-downloader-e2e:chrome128`; set `E2E_CHROME128_IMAGE`
to use a prebuilt equivalent image. Like the other local browser tests, this
command skips in CI.

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

## 🚧 Build Variants

HLS Downloader is available in multiple build variants to accommodate different distribution requirements:

### Store Builds (Firefox Add-ons / Edge Add-ons)

Official store releases include a blocklist that respects copyright holder opt-out requests. This version complies with distribution platform policies and content owner preferences.

### Independent Builds

Alternative builds are available for advanced users who prefer complete local control. These "experimental" variants contain no blocklist and allow unrestricted operation:

```bash
# MV2 without blocklist (Firefox/Edge manual install)
pnpm run build:mv2:no-blocklist

# MV3 without blocklist (Chrome/Brave/Arc manual install)
pnpm run build:mv3:no-blocklist

# Build all variants at once
pnpm run build:all-variants
```

Non-blocklist builds are named "HLS Downloader (Experimental No Blocklist)" and are intended for personal use only—not for redistribution on official stores.

---

## 🤚 Disclaimer

This extension is designed for downloading video content that you own or have authorization to access. **It is prohibited to use this tool for downloading copyrighted content without permission.** Users are solely responsible for their actions, and the developer assumes no liability for user behavior. This tool is provided "as-is" without warranty of any kind.

---

## 🚫 Copyright Protection and Opt-Out Policy

We respect the intellectual property rights and legitimate interests of all websites and content operators.

If you do not wish this tool to operate on your website, you may submit an opt-out request. We will add verified domains to the project's blocklist in subsequent releases.

### How to Submit an Opt-Out Request

1. Create a new **[Issue](https://github.com/puemos/hls-downloader/issues/new?template=opt-out-request.yml)** using the "Opt-Out Request" template
2. Use the title format: `[Opt-Out Request] YourDomain.com`
3. Provide the following information for verification:
   - **Website Domain** (e.g., `example.com`)
   - **Contact Email** (for identity verification if necessary)

We commit to honoring legitimate requests and will include verified domains in the blocklist for store-distributed versions. Please note that as an open-source project, update cycles may vary. Thank you for your understanding and cooperation.

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
