# HLS Downloader – Current Functionality

This document outlines what the extension delivers today across detection, selection, downloading, storage, and configuration.

## Detection and Intake
- **Automatic HLS sniffing**: Background listener watches web requests for `.m3u8` content types and adds unique playlists per tab with page title and initiator details.
- **Toolbar feedback**: When a playlist finishes parsing, the extension icon is updated for that tab to signal a new capture is available.
- **Direct URL entry**: The Direct tab lets users paste a playlist URL manually, creating a playlist entry without sniffing network traffic.

## Playlist Parsing and Selection
- **Master playlist parsing**: Retrieves master manifests and extracts stream and audio renditions, including bitrate, resolution, and FPS, sorted from highest to lowest quality.
- **Subtitle/CC detection**: Parses SUBTITLES and CLOSED-CAPTIONS media groups when provided, exposing downloadable subtitle tracks alongside audio/video.
- **Level filtering**: Only playlists that parse successfully move to the “ready” state and appear in the UI lists.
- **Quality selection**: Users can pick one video rendition and, when available, a separate audio rendition before downloading.
- **Metadata visibility**: For selected levels, the UI shows URIs plus technical metadata (bitrate, resolution, FPS).

## Download Pipeline
- **Fragment discovery**: Fetches level playlists and enumerates all fragments (including initialization segments) with absolute URLs.
- **Resilient fetching**: Each fragment download supports configurable retry attempts and parallelism (concurrency) to balance speed and robustness.
- **Decryption**: AES-128 encrypted fragments are decrypted via the Web Crypto API when keys and IVs are present in the playlist.
- **Local storage buckets**: Video and audio fragments are written into IndexedDB buckets keyed by job ID, keeping all data local.
- **FFmpeg-based muxing**: Uses ffmpeg.wasm to concatenate and mux audio/video fragments into MP4. Supports video-only or audio-only cases gracefully.
- **Offscreen support for MV3**: Creates an offscreen document (when available) to generate object URLs for downloads without blocking the service worker.
- **Save flow**: Downloads API saves the produced MP4, honoring the user’s save dialog preference and uniquifying filenames when conflicts occur.
- **Subtitle export**: When a subtitle/CC track is selected, its playlist is fetched and concatenated to a `.vtt` file that is saved via the browser downloads API.

## UI Modules
- **Sniffer tab**: Lists detected playlists with filter, copy-URLs, clear-all, and per-item drill-in to select tracks.
- **Direct tab**: Accepts manual playlist URLs and lists the resulting parsed entries for selection and download.
- **Playlist view**: Shows available video/audio levels, lets users choose primary and optional audio tracks, and triggers downloads.
- **Downloads tab**: Shows active and finished jobs with progress, cancel, delete, download/retry, and save controls.
- **Settings tab**: Adjusts concurrency, fetch attempts, and whether the browser shows the save-as dialog.
- **About tab**: Shows version metadata and quick links to issues, source, privacy policy, and license.

## Persistence and Cleanup
- **Config persistence**: Concurrency, fetch attempts, and save dialog preferences are stored in extension storage and restored on startup.
- **Bucket cleanup**: A startup cleanup epic clears IndexedDB buckets based on cached metadata to avoid stale storage accumulation.
- **Non-persistence of jobs/playlists**: Playlists and download jobs currently live in memory only and are cleared when the extension reloads.

## Build and Compatibility
- **Manifest variants**: Supports MV2 and MV3 builds; MV3 uses offscreen documents for blob URL creation.
- **Browser coverage**: Works across Firefox and Chromium-based browsers with manual load options where stores are unavailable.
