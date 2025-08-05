# Capture a stream

This guide walks through saving a video that is delivered using the HLS
protocol.

1. Browse to a page that plays an HLS video and start playback.
2. Click the **HLS Downloader** icon. Detected playlists will appear in the
   **Sniffer** tab.
3. Choose **Select** next to the playlist you want to download. If multiple
   variants are available, pick the one that matches your desired quality.
4. Pick the video and audio streams from the playlist view. You can download
   either muxed or separate tracks.
5. Press **Download**. The extension fetches all segments and automatically
   merges them into a single MP4 using the bundled `ffmpeg.wasm`.
6. Track progress in the **Downloads** tab and keep the page open while
   merging completes. When the process finishes, your browser will prompt you
   to save the merged file.

`ffmpeg` support is bundled with the extension so no external dependencies are
required. Longer videos may take additional time to merge depending on your
hardware.
