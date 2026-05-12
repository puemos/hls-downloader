import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { execFile, execFileSync } from "node:child_process";

const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE_PATH = process.env.FFPROBE_PATH ?? "ffprobe";

/**
 * Adapter that implements the same 4-method interface as @ffmpeg/ffmpeg's FFmpeg class
 * (writeFile, exec, readFile, deleteFile) but delegates to the host ffmpeg binary
 * via a temp directory. This lets us run the real muxExec() in Node/vitest.
 */
export class FFmpegHostAdapter {
  private constructor(public readonly tempDir: string) {}

  static async create(): Promise<FFmpegHostAdapter> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ffmpeg-e2e-"));
    return new FFmpegHostAdapter(dir);
  }

  async writeFile(name: string, data: Uint8Array): Promise<void> {
    await fs.writeFile(path.join(this.tempDir, name), data);
  }

  exec(args: string[]): Promise<number> {
    return new Promise((resolve) => {
      execFile(
        FFMPEG_PATH,
        ["-nostdin", ...args],
        { cwd: this.tempDir, maxBuffer: 50 * 1024 * 1024 },
        (error) => {
          if (!error) return resolve(0);
          const code = (error as NodeJS.ErrnoException).code;
          resolve(typeof code === "number" ? code : 1);
        }
      );
    });
  }

  async readFile(name: string): Promise<Uint8Array> {
    return new Uint8Array(await fs.readFile(path.join(this.tempDir, name)));
  }

  async deleteFile(name: string): Promise<void> {
    await fs.unlink(path.join(this.tempDir, name));
  }

  async cleanup(): Promise<void> {
    await fs.rm(this.tempDir, { recursive: true, force: true });
  }
}

// ── ffprobe helpers ──

export interface ProbeStream {
  codec_type: string;
  codec_name: string;
  width?: number;
  height?: number;
  sample_rate?: string;
  channels?: number;
  nb_frames?: string;
}

export interface ProbeResult {
  sha256: string;
  sizeBytes: number;
  duration: string;
  streams: ProbeStream[];
}

export async function ffprobe(filePath: string): Promise<ProbeResult> {
  const raw = await new Promise<string>((resolve, reject) => {
    execFile(
      FFPROBE_PATH,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration,size",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,sample_rate,channels,nb_frames",
        "-of",
        "json",
        filePath,
      ],
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    );
  });

  const { format, streams: rawStreams = [] } = JSON.parse(raw);

  const streams: ProbeStream[] = rawStreams.map(
    (s: Record<string, unknown>) => {
      const stream: ProbeStream = {
        codec_type: s.codec_type as string,
        codec_name: s.codec_name as string,
      };
      if (s.codec_type === "video") {
        stream.width = s.width as number;
        stream.height = s.height as number;
      }
      if (s.codec_type === "audio") {
        stream.sample_rate = s.sample_rate as string;
        stream.channels = s.channels as number;
      }
      if (s.nb_frames && s.nb_frames !== "N/A") {
        stream.nb_frames = s.nb_frames as string;
      }
      return stream;
    }
  );

  const fileBytes = await fs.readFile(filePath);

  return {
    sha256: crypto.createHash("sha256").update(fileBytes).digest("hex"),
    sizeBytes: fileBytes.byteLength,
    duration: format.duration as string,
    streams,
  };
}

export function isFFmpegAvailable(): boolean {
  try {
    execFileSync(FFMPEG_PATH, ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
