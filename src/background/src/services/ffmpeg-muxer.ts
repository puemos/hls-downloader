import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export type MuxRequest = {
  ffmpeg: FFmpeg;
  outputFileName: string;
  videoBlob?: Blob;
  audioBlob?: Blob;
  subtitleText?: string;
  subtitleLanguage?: string;
};

export type MuxResult = { blob: Blob; mime: string };

async function writeSubtitles(
  ffmpeg: FFmpeg,
  subtitleText: string | undefined
) {
  if (subtitleText === undefined) {
    return;
  }
  const blob = new Blob([subtitleText], { type: "text/vtt" });
  await ffmpeg.writeFile("subtitles.vtt", await fetchFile(blob));
}

export async function muxStreams({
  ffmpeg,
  outputFileName,
  videoBlob,
  audioBlob,
  subtitleText,
  subtitleLanguage,
}: MuxRequest): Promise<MuxResult> {
  const includeSubtitles = subtitleText !== undefined;
  const hasVideo = Boolean(videoBlob);
  const hasAudio = Boolean(audioBlob);

  if (hasVideo) {
    await ffmpeg.writeFile("video.ts", await fetchFile(videoBlob!));
  }
  if (hasAudio) {
    await ffmpeg.writeFile("audio.ts", await fetchFile(audioBlob!));
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
    args.push("-map", "0:v:0", "-c:v", "copy");
    if (includeSubtitles) {
      args.push("-map", `${hasAudio ? "2" : "1"}:s:0`);
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
  } else {
    throw new Error("No media to mux");
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
