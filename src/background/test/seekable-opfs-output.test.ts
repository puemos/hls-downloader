import { describe, expect, it, vi } from "vitest";
import { buildMuxArgs } from "../src/services/ffmpeg-muxer";
import {
  OPFS_OUTPUT_DEVICE_PATH,
  registerSeekableOpfsOutputDevice,
} from "../src/services/seekable-opfs-output";

describe("seekable OPFS FFmpeg output", () => {
  it("supports positional writes, reads, and seeks without a media Blob", () => {
    let bytes = new Uint8Array();
    let operations: any;
    const flush = vi.fn();
    const accessHandle = {
      write(source: Uint8Array, { at }: { at: number }) {
        const next = new Uint8Array(
          Math.max(bytes.byteLength, at + source.byteLength),
        );
        next.set(bytes);
        next.set(source, at);
        bytes = next;
        return source.byteLength;
      },
      read(target: Uint8Array, { at }: { at: number }) {
        const source = bytes.subarray(at, at + target.byteLength);
        target.set(source);
        return source.byteLength;
      },
      getSize: () => bytes.byteLength,
      flush,
    };
    class ErrnoError extends Error {
      constructor(readonly errno: number) {
        super(`errno ${errno}`);
      }
    }
    const core = {
      FS: {
        makedev: vi.fn(() => 80),
        registerDevice: vi.fn((_device: number, value: any) => {
          operations = value;
        }),
        mkdev: vi.fn(),
        ErrnoError,
      },
    };

    registerSeekableOpfsOutputDevice(core, accessHandle as any);
    expect(core.FS.mkdev).toHaveBeenCalledWith(
      OPFS_OUTPUT_DEVICE_PATH,
      0o666,
      80,
    );

    const stream = { position: 0, node: { size: 0 } };
    operations.open(stream);
    expect(stream).toMatchObject({ seekable: true });
    expect(
      operations.write(stream, new Uint8Array([9, 1, 2, 9]), 1, 2, 0),
    ).toBe(2);
    expect(operations.write(stream, new Uint8Array([3]), 0, 1, 5)).toBe(1);
    expect(bytes).toEqual(new Uint8Array([1, 2, 0, 0, 0, 3]));
    expect(stream.node.size).toBe(6);

    const target = new Uint8Array(4);
    expect(operations.read(stream, target, 1, 2, 0)).toBe(2);
    expect(target).toEqual(new Uint8Array([0, 1, 2, 0]));
    expect(operations.llseek({ position: 2 }, 3, 1)).toBe(5);
    expect(operations.llseek({ position: 0 }, -1, 2)).toBe(5);
    expect(() => operations.llseek(stream, -1, 0)).toThrow(ErrnoError);

    operations.close();
    expect(flush).toHaveBeenCalledOnce();
  });

  it("requests standard MP4 and Matroska muxers on the seekable device", () => {
    const mp4 = buildMuxArgs({
      outputFileName: OPFS_OUTPUT_DEVICE_PATH,
      outputFormat: "mp4",
      hasVideo: true,
      hasAudio: true,
      videoFileName: "concatf:/video.concat.txt",
      audioFileName: "concatf:/audio.concat.txt",
      videoContainer: "mp4",
      audioContainer: "mp4",
    });
    expect(mp4.slice(-3)).toEqual(["-f", "mp4", OPFS_OUTPUT_DEVICE_PATH]);
    expect(mp4).not.toContain("-movflags");
    expect(mp4.join(" ")).not.toMatch(/frag_keyframe|empty_moov/);

    const matroska = buildMuxArgs({
      outputFileName: OPFS_OUTPUT_DEVICE_PATH,
      outputFormat: "matroska",
      hasVideo: true,
      hasAudio: false,
    });
    expect(matroska.slice(-3)).toEqual([
      "-f",
      "matroska",
      OPFS_OUTPUT_DEVICE_PATH,
    ]);
  });
});
