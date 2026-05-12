#!/usr/bin/env bash
set -euo pipefail

# Downloads real HLS segments from public test streams and trims to ~3s.
# Run once locally, commit the binaries. CI uses the committed files.
#
# Sources:
#   Big Buck Bunny  — https://test-streams.mux.dev (muxed v+a, MPEG-TS)
#   Tears of Steel  — https://demo.unified-streaming.com (muxed v+a, audio-only, MPEG-TS)
#
# Requires: curl, ffmpeg/ffprobe

FFMPEG="${FFMPEG:-/opt/homebrew/bin/ffmpeg}"
FFPROBE="${FFPROBE:-/opt/homebrew/bin/ffprobe}"
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

BBB_BASE="https://test-streams.mux.dev/x36xhzz"
TOS_BASE="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism"

TRIM=3  # seconds to keep from each segment

echo ""
echo "============================================="
echo " Downloading real HLS fixtures"
echo "============================================="
echo ""

# ── 1) Muxed video+audio segment 1 (Big Buck Bunny 480p, trimmed to ~3s) ──
echo "==> Downloading + trimming video-audio-muxed.ts (Big Buck Bunny 480p seg 1)"
curl -sL "${BBB_BASE}/url_6/url_846/193039199_mp4_h264_aac_hq_7.ts" -o _tmp_bbb1.ts
"$FFMPEG" -y -hide_banner -loglevel error \
  -i _tmp_bbb1.ts -t "$TRIM" -c copy -f mpegts video-audio-muxed.ts

# ── 2) Muxed video+audio segment 2 (Big Buck Bunny 480p, different scene) ──
echo "==> Downloading + trimming video-audio-seg2.ts (Big Buck Bunny 480p seg 2)"
curl -sL "${BBB_BASE}/url_6/url_850/193039199_mp4_h264_aac_hq_7.ts" -o _tmp_bbb2.ts
"$FFMPEG" -y -hide_banner -loglevel error \
  -i _tmp_bbb2.ts -t "$TRIM" -c copy -f mpegts video-audio-seg2.ts

# ── 3) Video-only: strip audio from a Big Buck Bunny segment ──
echo "==> Creating video-only.ts (Big Buck Bunny 240p, audio stripped)"
curl -sL "${BBB_BASE}/url_2/url_528/193039199_mp4_h264_aac_ld_7.ts" -o _tmp_bbb_ld.ts
"$FFMPEG" -y -hide_banner -loglevel error \
  -i _tmp_bbb_ld.ts -t "$TRIM" -an -c:v copy -f mpegts video-only.ts

# ── 4) Audio-only (Tears of Steel, real audio-only variant with timed_id3) ──
echo "==> Downloading audio-only.ts (Tears of Steel audio-only seg)"
curl -sL "${TOS_BASE}/tears-of-steel-audio_eng=64008-1.ts" -o audio-only.ts
# This segment is already ~4s, keep as-is (it naturally has a timed_id3 data stream)

# ── 5) Muxed with extra stream (Tears of Steel v+a + added extra audio PID) ──
echo "==> Creating muxed-with-data-stream.ts (Tears of Steel muxed + extra stream)"
curl -sL "${TOS_BASE}/tears-of-steel-audio_eng=64008-video_eng=401000-1.ts" -o _tmp_tos.ts
"$FFMPEG" -y -hide_banner -loglevel error \
  -i _tmp_tos.ts \
  -f lavfi -i "sine=frequency=1:sample_rate=8000:duration=4" \
  -map 0:v -map 0:a -map 1:a \
  -c:v copy -c:a copy -c:a:1 aac -b:a:1 16k \
  -f mpegts muxed-with-data-stream.ts

rm -f _tmp_bbb1.ts _tmp_bbb2.ts _tmp_bbb_ld.ts _tmp_tos.ts

echo ""
echo "==> Verifying fixtures..."
for f in video-audio-muxed.ts video-audio-seg2.ts video-only.ts audio-only.ts muxed-with-data-stream.ts; do
  echo "--- $f ---"
  size=$(wc -c < "$f" | tr -d ' ')
  duration=$("$FFPROBE" -v error -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null || echo "?")
  echo "  Size: ${size} bytes  Duration: ${duration}s"
  "$FFPROBE" -hide_banner -show_entries stream=index,codec_type,codec_name -of compact "$f" 2>/dev/null || true
  first_byte=$(xxd -l 1 -p "$f")
  if [ "$first_byte" = "47" ]; then
    echo "  TS sync byte: OK (0x47)"
  else
    echo "  WARNING: first byte is 0x${first_byte}, expected 0x47!"
  fi
  echo ""
done

echo "==> Generating M3U8 playlists..."

cat > master.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=836280,CODECS="mp4a.40.2,avc1.64001f",RESOLUTION=848x480
level-muxed.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=246440,CODECS="avc1.42000d",RESOLUTION=320x184
level-video-only.m3u8
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",DEFAULT=YES,LANGUAGE="en",URI="level-audio-only.m3u8"
M3U8

cat > level-muxed.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:3.000,
video-audio-muxed.ts
#EXTINF:3.000,
video-audio-seg2.ts
#EXT-X-ENDLIST
M3U8

cat > level-video-only.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:3.000,
video-only.ts
#EXT-X-ENDLIST
M3U8

cat > level-audio-only.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-VERSION:3
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:4.000,
audio-only.ts
#EXT-X-ENDLIST
M3U8

cat > cmaf-master.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=500000,CODECS="avc1.64001f",RESOLUTION=848x480
cmaf-level.m3u8
M3U8

cat > cmaf-level.m3u8 <<'M3U8'
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:4
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="cmaf-stream.mp4",BYTERANGE="100@0"
#EXTINF:4.0,
#EXT-X-BYTERANGE:200@100
cmaf-stream.mp4
#EXTINF:4.0,
#EXT-X-BYTERANGE:200@300
cmaf-stream.mp4
#EXT-X-ENDLIST
M3U8

echo ""
echo "============================================="
echo " Generating fMP4 fixtures from TS sources"
echo "============================================="
echo ""

# ── 6) fMP4 video-only (remuxed from video-only.ts) ──
echo "==> Remuxing video-only.ts → fmp4-video-only.mp4 (fragmented MP4)"
"$FFMPEG" -y -hide_banner -loglevel error \
  -i video-only.ts -c copy \
  -movflags +frag_keyframe+empty_moov \
  -f mp4 e2e-output/fmp4-video-only.mp4

# ── 7) fMP4 audio-only (remuxed from audio-only.ts) ──
echo "==> Remuxing audio-only.ts → fmp4-audio-only.mp4 (fragmented MP4)"
"$FFMPEG" -y -hide_banner -loglevel error \
  -i audio-only.ts -c copy \
  -movflags +frag_keyframe+empty_moov \
  -f mp4 e2e-output/fmp4-audio-only.mp4

echo ""
echo "==> Verifying fMP4 fixtures..."
for f in e2e-output/fmp4-video-only.mp4 e2e-output/fmp4-audio-only.mp4; do
  echo "--- $f ---"
  size=$(wc -c < "$f" | tr -d ' ')
  duration=$("$FFPROBE" -v error -show_entries format=duration -of csv=p=0 "$f" 2>/dev/null || echo "?")
  echo "  Size: ${size} bytes  Duration: ${duration}s"
  "$FFPROBE" -hide_banner -show_entries stream=index,codec_type,codec_name -of compact "$f" 2>/dev/null || true
  first_bytes=$(xxd -l 8 -p "$f")
  echo "  First 8 bytes: ${first_bytes}"
  echo ""
done

echo "==> Done! All fixtures generated from real HLS streams."
