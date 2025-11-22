# HLS Downloader Changelog

# HLS Downloader Changelog

## 5.1.0

### Features
- Manifest V3 support for Chromium browsers using an offscreen document to create blob URLs in the service-worker background.
- Dual build pipeline with separate MV2 (Firefox/Chromium) and MV3 (Chromium) artifacts and clearer tester instructions.

### Fixes
- Ensure MV2 background bundles emit as `background.js` and package popup/background files into the root of the ZIP/XPI for direct installs.

### Chores
- CI builds both MV2 and MV3 targets; release uploads MV2 Firefox/Chromium and MV3 Chromium artifacts.
- Added “For Dear Testers” guide for Firefox/Chromium reviewers and clarified MV3 Chromium-only caveat.

## 5.0.0

### Features
- Merge audio and video streams for complete media exports (#430) – addresses long‑standing “No Audio” reports (e.g. issue #23)
- Display toolbar icon immediately after playlist confirmation for quicker access (#431)
- New theme and redesigned About page (#432, #435)
- Major UI overhaul of sniffer, playlist, settings, and downloads pages (#437)
- Added Storybook scenarios covering core UI components (#438)
- Sniffer can copy playlist URLs directly (#443)
- Report link now opens via the browser Tabs API (#445)
- Hover tooltips and improved truncation keep long playlist names from hiding the Save button (#444) – resolves issues #342 & #343
- Normalized generated filenames and clearer save‑status feedback
- More reliable retry logic for failed requests
- Correct handling of map byte ranges and encrypted initialization segments (#442)
- Automatically selects appropriate playlist levels (#447)

### Fixes
- Security updates

### Chores
- Added usage instructions and updated automation guidelines (#436)
- Vitest setup with broad coverage for core, popup, controller, and hook logic (#446, #448, #449, #452–455)
- Fetch-loader and crypto decryptor unit tests
- Coverage reporting with badge generation (#456)
- CI executes test suites automatically (#454)
- Build-system improvements and npm workspace migration (#428)

## 4.1.2

### Fixes
- Width for playlists and downloads cards
- Security updates

## 4.1.1

### Fixes
- Max width for playlists and downloads
- Security updates

## 4.1.0

### Features
- Direct downloads

### Fixes
- .ts as a file type (UI only)

## 4.0.2

### Fixes
- Security updates

## 4.0.1

### Fixes
- Security updates

## 4.0.0

### Features
- Videos are transformed to mp4 on the fly
- Using https://github.com/puemos/browser-extension-template
- Total new design

### Fixes
- Security updates

## 3.3.0

Big thanks to @mayfield!!

### Features
- FPS info
- Audio-only media support
- Improve retry backoff

## 3.2.2

### Fixes
- Security updates

## 3.2.1

### Fixes
- Download fail on Firefox
- Filter playlists
- SaveAs dialog Switch

## 3.2.0

### Features
- The extension will retry failed download attempts

## 3.1.2

### Chores
- Yarn to NPM

## 3.1.1

### Chores
- Paypal -> GitHub Sponsors

## 3.1.0

### Features
- Direct download

### Fixes
- Several UI fixes

## 3.0.0

### Features
- Unlimited Storage permission
- Use IndexedDB for storing chunks
- Downloads are separated as Jobs
- New empty status design
- Download progress UI

## 2.2.0

### Features
- Cancel a download

## 1.7.2

### Fixes
- [#51](https://github.com/puemos/hls-downloader-chrome-extension/issues/51) After deleting a download, the download page crashes

## 1.7.1

### Chores
- Change copy button to use text
- Refactor the GitHub action to use chrome-webstore-upload-cli

## 1.7.0

### Features
- Auto save
- Use page title for the file name
- UI Enhancements
- Updated to the latest style-components

## 1.6.3

### Features
- New UI
- Updated to the latest create-react-app
- Use parcel to pack the background app
- Refactor the stories

### Fixes
- URL resolve issues
- [#45](https://github.com/puemos/hls-downloader-chrome-extension/issues/45)
- [#43](https://github.com/puemos/hls-downloader-chrome-extension/issues/43)
- [#41](https://github.com/puemos/hls-downloader-chrome-extension/issues/41)

## 1.5.0

### Features
- Auto-download playlist

## 1.4.1

### Chores
- Upgrade dependencies

## 1.4.0

### Features
- AES decrypt

## 1.3.1

### Fixes
- Badge indicator update on tab remove

## 1.3.0

### Features
- Save as
- Badge indicator

### Chores
- Update dependencies

## 1.2.1

### Chores
- Update dependencies

## 1.2.0

### Features
- Rebranding
- Copy playlist URL link
- Storybook
- Colors and styles

### Fixes
- Wildcard for playlists

## 1.1.0

### Features
- Timestamps for sniffer & downloads
- Tabs style

### Fixes
- Playlist relative URI
- Scrollbars
