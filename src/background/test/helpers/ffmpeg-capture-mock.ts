import { vi } from "vitest";

export interface CapturedWrite {
  filename: string;
  data: Uint8Array;
}

export interface FFmpegCaptureState {
  writes: CapturedWrite[];
  execArgs: string[][];
  deletedFiles: string[];
  execReturnValue: number;
}

/**
 * Shared mutable state for the capturing FFmpeg mock.
 * Because vi.mock() factory runs before imports, we expose the state
 * as a standalone object that both the factory and tests can reference.
 */
export function createCaptureState(): FFmpegCaptureState {
  return {
    writes: [],
    execArgs: [],
    deletedFiles: [],
    execReturnValue: 0,
  };
}

/**
 * Returns a vi.mock factory for @ffmpeg/ffmpeg that captures all
 * writeFile data, exec args, and deleteFile calls into the given state.
 *
 * Usage in a test file:
 *
 *   import { createCaptureState, ffmpegMockFactory } from "./helpers/ffmpeg-capture-mock";
 *   const capture = createCaptureState();
 *   vi.mock("@ffmpeg/ffmpeg", () => ffmpegMockFactory(capture));
 */
export function ffmpegMockFactory(state: FFmpegCaptureState) {
  return {
    FFmpeg: vi.fn().mockImplementation(() => ({
      load: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      writeFile: vi.fn(async (filename: string, data: Uint8Array) => {
        state.writes.push({ filename, data: new Uint8Array(data) });
      }),
      readFile: vi.fn().mockResolvedValue(new Uint8Array([0, 0, 0, 0])),
      exec: vi.fn(async (args: string[]) => {
        state.execArgs.push([...args]);
        return state.execReturnValue;
      }),
      deleteFile: vi.fn(async (filename: string) => {
        state.deletedFiles.push(filename);
      }),
    })),
  };
}

/**
 * Helper accessors for asserting on captured state.
 */
export function captureHelpers(state: FFmpegCaptureState) {
  return {
    getWrites: () => state.writes,
    getExecArgs: () => state.execArgs,
    getDeletedFiles: () => state.deletedFiles,
    getVideoWrite: () =>
      state.writes.find(
        (w) => w.filename === "video.ts" || w.filename === "video.mp4"
      ),
    getAudioWrite: () =>
      state.writes.find(
        (w) => w.filename === "audio.ts" || w.filename === "audio.mp4"
      ),
    getSubtitleWrite: () =>
      state.writes.find((w) => w.filename === "subtitles.vtt"),
    getWriteByFilename: (name: string) =>
      state.writes.find((w) => w.filename === name),
    reset() {
      state.writes.length = 0;
      state.execArgs.length = 0;
      state.deletedFiles.length = 0;
      state.execReturnValue = 0;
    },
  };
}
