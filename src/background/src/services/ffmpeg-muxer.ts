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
  videoFileName?: string;
  audioFileName?: string;
  subtitleText?: string;
  subtitleLanguage?: string;
};

export type MuxResult = { blob: Blob; mime: string };

export function detectFmp4(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  const boxType = String.fromCharCode(data[4], data[5], data[6], data[7]);
  return boxType === "ftyp";
}

function isMp4ContainerFile(fileName: string): boolean {
  return /\.(m4a|m4v|mp4)$/i.test(fileName);
}

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
  await ffmpeg.writeFile(
    "subtitles.vtt",
    new TextEncoder().encode(subtitleText)
  );
}

export async function muxExec({
  ffmpeg,
  outputFileName,
  hasVideo,
  hasAudio,
  videoFileName = "video.ts",
  audioFileName = "audio.ts",
  subtitleText,
  subtitleLanguage,
}: MuxExecRequest): Promise<MuxResult> {
  const includeSubtitles = subtitleText !== undefined;

  if (!hasVideo && !hasAudio) {
    throw new Error("No media to mux");
  }

  await writeSubtitles(ffmpeg, subtitleText);

  const audioNeedsAdtsToAsc = hasAudio && !isMp4ContainerFile(audioFileName);

  const args: string[] = ["-y"];

  if (hasVideo) {
    args.push("-i", videoFileName);
  }
  if (hasAudio) {
    args.push("-i", audioFileName);
  }
  if (includeSubtitles) {
    args.push("-i", "subtitles.vtt");
  }

  if (hasVideo && hasAudio) {
    args.push("-map", "0:v:0", "-map", "1:a:0");
    if (includeSubtitles) {
      args.push("-map", "2:s:0");
    }
    args.push("-c:v", "copy", "-c:a", "copy");
    if (audioNeedsAdtsToAsc) {
      args.push("-bsf:a", "aac_adtstoasc");
    }
  } else if (hasVideo) {
    // Map video + optional embedded audio, skip data/metadata streams
    args.push("-map", "0:v", "-map", "0:a?", "-c", "copy");
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

  if (hasVideo && hasAudio) {
    args.push("-shortest");
  }
  args.push(outputFileName);

  try {
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`FFmpeg exited with code ${exitCode}`);
    }
    const data = await ffmpeg.readFile(outputFileName);
    const mime = includeSubtitles ? "video/x-matroska" : "video/mp4";
    return { blob: new Blob([data], { type: mime }), mime };
  } finally {
    const cleanupFiles = [
      hasVideo ? videoFileName : null,
      hasAudio ? audioFileName : null,
      includeSubtitles ? "subtitles.vtt" : null,
      outputFileName,
    ].filter((fileName): fileName is string => fileName !== null);

    for (const fileName of cleanupFiles) {
      try {
        await ffmpeg.deleteFile(fileName);
      } catch (_e) {
        // best effort cleanup
      }
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
  const videoFileName =
    videoData && detectFmp4(videoData) ? "video.mp4" : "video.ts";
  const audioFileName =
    audioData && detectFmp4(audioData) ? "audio.mp4" : "audio.ts";

  if (videoData) {
    await writeMediaToFFmpegFS(ffmpeg, videoFileName, videoData);
  }
  if (audioData) {
    await writeMediaToFFmpegFS(ffmpeg, audioFileName, audioData);
  }

  return muxExec({
    ffmpeg,
    outputFileName,
    hasVideo: Boolean(videoData),
    hasAudio: Boolean(audioData),
    videoFileName,
    audioFileName,
    subtitleText,
    subtitleLanguage,
  });
}
