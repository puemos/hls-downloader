export const OPFS_OUTPUT_DEVICE_PATH = "/dev/opfs-output";

export function registerSeekableOpfsOutputDevice(
  core: any,
  accessHandle: FileSystemSyncAccessHandle,
): void {
  const handle = accessHandle as any;
  const device = core.FS.makedev(80, 0);
  core.FS.registerDevice(device, {
    open(stream: any) {
      stream.seekable = true;
    },
    close() {
      handle.flush();
    },
    read(
      stream: any,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position?: number,
    ) {
      const at = Number(position ?? stream.position ?? 0);
      return handle.read(buffer.subarray(offset, offset + length), { at });
    },
    write(
      stream: any,
      buffer: Uint8Array,
      offset: number,
      length: number,
      position?: number,
    ) {
      const at = Number(position ?? stream.position ?? 0);
      const written = handle.write(buffer.subarray(offset, offset + length), {
        at,
      });
      stream.node.size = Math.max(stream.node.size ?? 0, at + written);
      stream.node.timestamp = Date.now();
      return written;
    },
    llseek(stream: any, offset: number, whence: number) {
      let next = Number(offset);
      if (whence === 1) {
        next += Number(stream.position ?? 0);
      } else if (whence === 2) {
        next += Number(handle.getSize());
      }
      if (next < 0) {
        throw new core.FS.ErrnoError(28);
      }
      return next;
    },
  });
  core.FS.mkdev(OPFS_OUTPUT_DEVICE_PATH, 0o666, device);
}
