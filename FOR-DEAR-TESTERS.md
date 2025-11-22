# For Dear Testers (Firefox & Chromium)

A short guide for Mozilla/Chromium QA to build and exercise the extension locally. Everything below uses the pinned toolchain so clones stay reproducible.

## Prerequisites
- Node.js 20+ (ships with Corepack)
- Enable pnpm via Corepack:  
  ```bash
  corepack enable
  corepack prepare pnpm@10.11.0 --activate
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
  Outputs `dist/mv3/` plus `extension-mv3-chrome.zip` (MV3-labeled XPI also emitted if needed for testing).

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
- **Permissions:** extension should not request extra prompts beyond initial install; webRequest/tabs/downloads/storage only.
- **Logs:** background/offscreen logs appear in the inspected console. If something breaks, grab console output plus the page URL and steps.

## Known notes
- Build artifacts are temporary; run `pnpm run clean` after validation to avoid committing zips/dist.
- MV3 uses an offscreen document to create blob URLs; this is Chromium-only and shouldn’t affect Firefox testing.
