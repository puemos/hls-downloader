export function generateSequenceIv(sequence: bigint): Uint8Array {
  if (sequence < 0n || sequence > 0xffffffffffffffffn) {
    throw new RangeError("Media sequence must be an unsigned 64-bit integer");
  }

  const iv = new Uint8Array(16);
  new DataView(iv.buffer).setBigUint64(8, sequence, false);
  return iv;
}
