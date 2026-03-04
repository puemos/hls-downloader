import { FFmpeg } from "@ffmpeg/ffmpeg";

export type MuxRequest = {
  ffmpeg: FFmpeg;
  outputFileName: string;
  videoData?: Uint8Array;
  audioData?: Uint8Array;
  subtitleText?: string;
  subtitleLanguage?: string;
};

export type MuxExecRequest = {
  ffmpeg: FFmpeg;
  outputFileName: string;
  hasVideo: boolean;
  hasAudio: boolean;
  subtitleText?: string;
  subtitleLanguage?: string;
};

export type MuxResult = { blob: Blob; mime: string };

export async function writeMediaToFFmpegFS(
  ffmpeg: FFmpeg,
  filename: string,
  data: Uint8Array
): Promise<void> {
  await ffmpeg.writeFile(filename, data);
}

async function writeSubtitles(
  ffmpeg: FFmpeg,
  subtitleText: string | undefined
) {
  if (subtitleText === undefined) {
    return;
  }
  await ffmpeg.writeFile("subtitles.vtt", new TextEncoder().encode(subtitleText));
}

export async function muxExec({
  ffmpeg,
  outputFileName,
  hasVideo,
  hasAudio,
  subtitleText,
  subtitleLanguage,
}: MuxExecRequest): Promise<MuxResult> {
  const includeSubtitles = subtitleText !== undefined;

  if (!hasVideo && !hasAudio) {
    throw new Error("No media to mux");
  }

  await writeSubtitles(ffmpeg, subtitleText);

  const args: string[] = ["-y"];

  if (hasVideo) {
    args.push("-i", "video.ts");
  }
  if (hasAudio) {
    args.push("-i", "audio.ts");
  }
  if (includeSubtitles) {
    args.push("-i", "subtitles.vtt");
  }

  if (hasVideo && hasAudio) {
    args.push("-map", "0:v:0", "-map", "1:a:0");
    if (includeSubtitles) {
      args.push("-map", "2:s:0");
    }
    args.push("-c:v", "copy", "-c:a", "copy", "-bsf:a", "aac_adtstoasc");
  } else if (hasVideo) {
    // Map all streams from the video file (preserves embedded audio)
    args.push("-map", "0", "-c", "copy");
    if (includeSubtitles) {
      args.push("-map", "1:s:0", "-c:s", "webvtt");
    }
  } else if (hasAudio) {
    args.push(
      "-map",
      "0:a:0",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-af",
      "aresample=async=1:first_pts=0"
    );
    if (includeSubtitles) {
      args.push("-map", "1:s:0");
    }
  }

  if (includeSubtitles) {
    args.push("-c:s", "webvtt");
    args.push("-metadata:s:s:0", `language=${subtitleLanguage || "und"}`);
  }

  args.push("-shortest", outputFileName);

  try {
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputFileName);
    const mime = includeSubtitles ? "video/x-matroska" : "video/mp4";
    return { blob: new Blob([data], { type: mime }), mime };
  } finally {
    try {
      if (hasVideo) await ffmpeg.deleteFile("video.ts");
      if (hasAudio) await ffmpeg.deleteFile("audio.ts");
      if (includeSubtitles) await ffmpeg.deleteFile("subtitles.vtt");
    } catch (_e) {
      // best effort cleanup
    }
  }
}

export async function muxStreams({
  ffmpeg,
  outputFileName,
  videoData,
  audioData,
  subtitleText,
  subtitleLanguage,
}: MuxRequest): Promise<MuxResult> {
  if (videoData) {
    await writeMediaToFFmpegFS(ffmpeg, "video.ts", videoData);
  }
  if (audioData) {
    await writeMediaToFFmpegFS(ffmpeg, "audio.ts", audioData);
  }

  return muxExec({
    ffmpeg,
    outputFileName,
    hasVideo: Boolean(videoData),
    hasAudio: Boolean(audioData),
    subtitleText,
    subtitleLanguage,
  });
}
