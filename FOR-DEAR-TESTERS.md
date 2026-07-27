# For Dear Testers (Firefox & Chromium)

A short guide for Mozilla/Chromium QA to build and exercise the extension locally. Everything below uses the pinned toolchain so clones stay reproducible.

## Prerequisites

- Firefox 128+ or Chromium 111+
- Node.js 22.12+ (ships with Corepack)
- Enable pnpm via Corepack:
  ```bash
  corepack enable
  corepack prepare pnpm@10.34.4 --activate
  ```
- From repo root: `pnpm install --frozen-lockfile`

## Build matrix

- **Firefox (MV2, recommended):**
  ```bash
  pnpm run build:mv2
  ```
  Outputs `dist/mv2/` plus `extension-mv2-firefox.xpi` (and `extension-mv2-chrome.zip` for Chromium MV2).
- **Chromium (MV3):**
  ```bash
  pnpm run build:mv3
  ```
  Outputs `dist/mv3/` plus `extension-mv3-chrome.zip`.  
  (Firefox MV3 service workers are not fully supported yet; use MV2 for Firefox.)

Artifacts are flat-packaged (files at archive root), ready for direct install.

## Firefox install (temporary, unsigned)

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Pick either `extension-mv2-firefox.xpi` **or** `dist/mv2/manifest.json` (unpacked).  
   The add-on stays until you restart Firefox.
4. In the same page, click **Inspect** on the extension to open DevTools for logs.

## Chromium install (MV3)

1. Build with `pnpm run build:mv3`.
2. Unzip `extension-mv3-chrome.zip`.
3. Visit `chrome://extensions` (or `edge://extensions`, etc.), enable **Developer mode**, click **Load unpacked**, and select the unzipped folder containing `manifest.json`.

## What to verify

- **Detection:** open an HLS page, play the video; extension should add the playlist and update the toolbar icon.
- **Playlist details:** qualities and audio tracks populate; no duplicate playlists on refresh.
- **Download:** pick a quality, start download, observe progress, and confirm the MP4 saves and plays.
- **Disk-backed finalization:** confirm a large download does not cause memory to grow with the media size, and that the saved MP4 is seekable in a normal media player.
- **Separate audio/subtitles:** verify a video + separate audio selection plays both tracks; adding WebVTT subtitles should save a playable MKV.
- **Cancellation/cleanup:** cancel during finalization and verify no completed file is offered and storage usage is reclaimed.
- **Storage policy:** Settings should describe browser storage without backend names. A conservative browser estimate may still be shown, but quota-exempt builds must label it as informational and must not show a false low-space warning.
- **Permissions:** install permissions should match the target manifest. On Firefox, accept a one-time browser storage persistence request if it appears when starting the first new download.
- **Logs:** background/offscreen logs appear in the inspected console. If something breaks, grab console output plus the page URL and steps.

## Known notes

- Build artifacts are temporary; run `pnpm run clean` after validation to avoid committing zips/dist.
- Firefox MV2 runs the mux worker from its background page. Chromium MV3 owns the same worker and object URL in an offscreen document.
- New jobs use OPFS. Jobs started on an older release stay on the legacy IndexedDB path and are not migrated.
- Firefox requests persistent origin storage before a new download. Chromium uses the manifest's unlimited storage permission, so a browser-reported 2 GiB estimate is not treated as a hard download limit.
