# HLS Downloader Changelog

## Unreleased

## 5.5.6

### Fixes

- Preserve complete audio and video when exporting WebVTT subtitles with separate media tracks. Short, sparse, or empty captions no longer cause FFmpeg to end the whole export early.

### Testing

- Added four native FFmpeg regressions that failed before the fix. They compare full decoded audio/video hashes with the source, including media tracks of different lengths. All 323 automated tests pass.
- Passed 20 real browser cases in Brave MV3 and Firefox MV2. Four reproduce v5.5.5's saved-but-truncated files; sixteen fixed exports preserve all 200 video frames, all 376 audio frames, source audio hashes, and subtitle cue text/timing across clear and encrypted TS/fMP4 streams.
- Workspace typechecking and the security gate pass.
- Passed the 16-case video/audio browser matrix without subtitles. All six release archives pass validation. Firefox lint reports zero errors and six existing warnings.

## 5.5.5

### Fixes

- Save audio-only primary playlists without requiring a video stream (#579). Keep optional embedded audio and continue excluding data and metadata streams from exports.

### Testing

- Added two native FFmpeg regressions for audio-only primary playlists, with and without selected alternate audio. Both paths failed before the fix. All 319 automated tests pass.
- Passed 20 real audio-only browser cases in Brave MV3 and Firefox MV2, including six reproductions of the old release's save failure. All fourteen fixed exports have complete audio matching the source hash. The alternate-audio case uses a different tone and verifies the selected track is saved.
- Passed the 16-case encrypted video/audio browser matrix after the fix, retaining all source video frames and matching full decoded audio. Typechecking and the security gate pass.
- All six release archives pass validation. Firefox lint reports zero errors and six existing warnings.

## 5.5.4

### Fixes

- Derive missing AES-128 IVs from each segment's media sequence number, preserving full 64-bit precision (#244). Keep explicit IVs and initialization-map keys separate from sequence-derived media IVs.
- Persist settings and saved track choices without runtime fragment IVs, which Chromium's extension storage rejects.

### Testing

- Added 13 regression tests covering implicit and explicit IVs, full 64-bit sequence numbers, clear lead-ins, discontinuities, initialization maps, key rotation, and settings persistence. All 317 tests pass.
- Added local tests that generate actual H.264/AAC HLS and exercise the installed extension UI in Brave MV3 and Firefox MV2. All 16 browser cases pass: four reproduce the old release's failures and twelve verify complete downloads, every video frame, decoded audio hashes, and full duration.
- Workspace typechecking, the security gate, and all six MV2/MV3 archive checks pass. Firefox lint reports zero errors and six existing warnings.

### Known issues

- The local full-media checks also expose an existing truncation bug when separate video and audio are muxed with WebVTT subtitles. It reproduces with unencrypted media and is not fixed by the AES-128 change. The encrypted CMAF download cases do not test the separate hls.js preview path.

## 5.5.3

### Fixes

- Prevent audio and subtitle tracks with matching names and groups from overwriting each other across playlists (#472). Keep track IDs stable when reloading a playlist and update matching saved selections from older versions.

### Testing

- Added 11 regression tests covering playlist identity, track types, query strings, ambiguous names, rescans, and saved selections. All 304 tests pass.
- Workspace typechecking and production builds pass.
- The security gate and all six MV2/MV3 archive checks pass. Firefox lint reports zero errors and six existing warnings.

## 5.5.2

### Dependencies and security

- Updated runtime and development dependencies throughout the workspace, including React 19.3, Redux Toolkit 2.13, Radix UI, HLS playback, Vite, Vitest, Storybook, and TypeScript definitions. Refreshed transitive dependencies in the lockfile.
- Updated the reproducible build environment to Node.js 22.23.4, npm 10.9.9, and pnpm 12.16.1. Migrated the install-script policy to pnpm's `allowBuilds` setting while retaining its default release-age protections.
- Updated GitHub Actions for checkout, Node setup, and release publication, and pinned them to immutable commit revisions.
- Patched the Firefox lint tool's `deepmerge@4.3.1` dependency against GHSA-gcqx-w48m-w2h4. Added security checks for null-prototype targets, target-side keys, nested placeholders, and array cloning, plus merge compatibility checks. The low-severity advisory remains visible in audit output until an upstream fix is published.

### Validation

- Passed 293 unit, integration, and component tests, workspace typechecking, security checks, and the Storybook build.
- Built and inspected all six MV2/MV3 release archives, including the variants without the blocklist. Firefox lint reported no errors and six existing warnings.
- Verified real stream discovery, preview, quality selection, and a video/audio/subtitle download in Chromium. The resulting MKV decoded successfully with FFmpeg.

## 5.5.1

### Fixes

- Fixed exports failing before the Save As dialog opens when a video title contains emoji zero-width joiners or other browser-invalid characters (#290, #590).
- Sanitize filenames again at the final export boundary, preserve Japanese text and ordinary emoji, and bound filename length while keeping the output extension.

### Build tooling

- Updated affected build and test dependencies to pass the release security audit, and replaced the brace-expansion compatibility patch with the fixed upstream release.
- Updated the reproducible build environment to Node.js 22.22.2 and npm 10.9.7 to meet the build dependencies' supported runtime requirements.

### Testing

- Added regression coverage for the exact title reported in #590, Unicode formatting and control characters, reserved names, long filenames, and MP4/MKV/subtitle exports.
- Reproduced the export failure before the fix and verified real stream downloads after the fix in Chromium and Firefox; decoded the saved MP4s with FFmpeg.

## 5.5.0

### Features

- Added an output-format setting for MP4 or MKV; downloads containing subtitles continue to use MKV automatically.
- Refreshed the popup with more consistent navigation, cards, controls, status presentation, storage information, and responsive scrolling.

### Fixes

- Made Firefox Add-ons source builds reproducible on Mozilla's ARM64 reviewer environment by installing the pinned pnpm release through npm instead of the obsolete bundled Corepack.
- Made Firefox publication return after AMO accepts a pending manual review instead of waiting indefinitely for approval.
- Moved new downloads to a disk-backed processing pipeline on Firefox MV2 and Chromium MV3, preventing memory consumption from growing with the complete media size.
- Added dedicated disk-backed muxing that produces normal seekable MP4 and MKV files.
- Kept generated artifacts available until the browser confirms completion or interruption, including duplicate saves and MV3 service-worker restarts.
- Added disk-space preflight checks, safe overwrite accounting, serialized muxing, coalesced repeated finalization, cancellation, and partial-output cleanup.
- Kept downloads started by older versions on the legacy IndexedDB finalization path instead of attempting an unsafe migration.
- Treated conservative storage estimates as informational when unlimited storage permission makes the extension quota-exempt.

### Security

- Updated vulnerable and outdated dependencies and added a repeatable security gate combining `pnpm audit` with verification of locally patched compatibility dependencies.
- Tightened the Firefox content security policy by removing `unsafe-eval`.

### Compatibility

- Requires Firefox 128 or newer and Chromium 111 or newer.
- Preserves existing settings and uses MP4 when the new output-format setting is absent.
- Keeps downloads started by an older extension version readable without migrating them. If legacy finalization runs out of memory, delete the job and download it again.
- Adds no new extension permissions.

### Testing

- Added coverage for disk-backed fragment routing, overwrite and quota behavior, seekable mux output, worker queuing and cancellation, artifact lifetime, persistence policy, UI workflows, and local browser E2E.
- `pnpm run security:audit`
- `pnpm run typecheck`
- `pnpm test`
- `pnpm run build:all-variants`
- `pnpm exec web-ext lint --source-dir dist/mv2`
- `pnpm test:e2e:local`

## 5.4.4

### Fixes

- Fixed the Firefox Add-ons publish command argument handling so AMO receives the listed-channel submission and matching source archive.
- Ensured failed AMO uploads still remove temporary source archives.

### Testing

- GitHub release workflow

## 5.4.3

### Fixes

- Made Firefox Add-ons source review reproducible by committing Firefox manifest metadata and removing post-build manifest mutation from the publish flow.
- Hardened release packaging so Firefox builds and source archives are created from the same committed revision.

### Testing

- `pnpm run build:mv2`
- `pnpm exec web-ext lint --source-dir dist/mv2`
- `pnpm test`

## 5.4.2

### Features

- Added sniffer playlist removal from the popup UI.

### Chores

- Hardened the dependency graph and removed stale package lock files.

### Testing

- `pnpm test`
- `pnpm run build:all-variants`

## 5.4.1

### Fixes

- Reduced muxing memory usage and preserved HLS byte ranges for CMAF/fMP4 playlists, addressing 0-byte saves and large-output failures reported in #522 and #523.
- Fixed release variant generation so no-blocklist MV2/MV3 archives are produced correctly.
- Made no-blocklist manifest generation compatible with current Node JSON module requirements.

### Chores

- Added automated Firefox AMO submission support.
- Updated design-system dependency security patches.

### Testing

- `pnpm test`
- `pnpm run build:all-variants`

## 5.4.0

### Features

- Added an auto-delete-after-save option for completed downloads.

### Fixes

- Preserved embedded audio in muxed HLS streams.
- Sanitized generated download filenames to remove illegal characters.
- Improved native select colors in Firefox dark mode.

## 5.3.1

### Features

- Added the download queue.
- Added storage usage estimates and total storage reporting.
- Added sniffer video previews.
- Added conditional blocklist support with an opt-out build variant.
- Propagated fallback query parameters through playlist handling.

### Fixes

- Hardened storage management reliability and added integration coverage.

### Chores

- Updated dependency security patches and pnpm override ranges.

## 5.2.0

### Features

- Subtitle downloads end-to-end: fetch VTT tracks, generate language-aware filenames, and mux into MKV when subtitles are present (`src/core/src/use-cases/download-subtitle-track.ts`, `src/background/src/services/ffmpeg-muxer.ts`).
- Richer audio and subtitle selection: parse default/autoselect/forced flags and group IDs, honor a preferred audio language, and persist per-playlist audio/subtitle choices while blocking downloads on unsupported encryption (`src/background/src/services/m3u8-parser.ts`, `src/core/src/store/slices/playlist-preferences-slice.ts`, `src/popup/src/modules/Playlist/PlaylistModule.tsx`).
- Sniffer gains direct URL entry and streamlined navigation (Direct tab removed); playlist UI shows metadata badges and quick copy buttons for track URLs (`src/popup/src/modules/Sniffer/SnifferView.tsx`, `src/popup/src/modules/Navbar/RouterView.tsx`, `src/popup/src/components/Metadata.tsx`).
- Job cards and About/Settings views refreshed with clearer status, hover/copy affordances, and Storybook scenarios seeded with realistic store state (`src/popup/src/modules/Job/JobView.tsx`, `src/popup/.storybook/preview.tsx`).

### Fixes

- More robust muxing pipeline with offscreen document fallback for MV3 and safer bucket cleanup when generating download blobs (`src/background/src/services/indexedb-fs.ts`, `src/background/src/offscreen.ts`).

### Chores

- Vite/tooling upgrade (`vite@6.4.1`, `pnpm@10.11.0`) and Storybook now runs from the popup package (`package.json`, `src/popup/.storybook/main.ts`).
- CI/release workflow tweaks: fixed permissions for publishing/coverage, added coverage badge workflow, removed CodeQL (`.github/workflows`).
- Added feature overview doc and pruned planning docs (`FUNCTIONALITIES.md`, `plans/roadmap.md`).

### Known issues

- Audio-only playlists are currently blocked from downloading because the playlist module requires a video level to mark media as available (`src/popup/src/modules/Playlist/PlaylistModule.tsx:174-177`).

### Testing

- `pnpm test`

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
