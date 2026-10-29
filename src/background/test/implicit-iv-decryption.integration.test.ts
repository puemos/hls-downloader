import { describe, expect, it, vi } from "vitest";
import { decryptSingleFragmentFactory } from "@hls-downloader/core/lib/use-cases";
import { M3u8Parser } from "../src/services/m3u8-parser";
import { CryptoDecryptor } from "../src/services/crypto-decryptor";

const base = "https://example.com/media.m3u8";
const keyBytes = new Uint8Array(16).fill(7);
const encoder = new TextEncoder();
const ivHex = (iv: Uint8Array | null | undefined) =>
  iv ? Buffer.from(iv).toString("hex") : null;

describe("AES-128 playlists without an explicit IV", () => {
  it.each([
    [
      undefined,
      "00000000000000000000000000000000",
      "00000000000000000000000000000001",
    ],
    [
      "42",
      "0000000000000000000000000000002a",
      "0000000000000000000000000000002b",
    ],
    [
      "4294967295",
      "000000000000000000000000ffffffff",
      "00000000000000000000000100000000",
    ],
    [
      "9007199254740993",
      "00000000000000000020000000000001",
      "00000000000000000020000000000002",
    ],
    [
      "18446744073709551614",
      "0000000000000000fffffffffffffffe",
      "0000000000000000ffffffffffffffff",
    ],
  ] as const)(
    "decrypts successive segments starting at sequence %s",
    async (sequence, firstIv, secondIv) => {
      const manifest = `#EXTM3U
#EXT-X-TARGETDURATION:6
${sequence === undefined ? "" : `#EXT-X-MEDIA-SEQUENCE:${sequence}`}
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXTINF:6,
first.ts
#EXTINF:6,
second.ts
#EXT-X-ENDLIST
`;
      const fragments = M3u8Parser.parseLevelPlaylist(
        manifest.replaceAll("\n", "\r\n"),
        base,
      );
      const loader = {
        fetchText: vi.fn(),
        fetchArrayBuffer: vi.fn().mockResolvedValue(keyBytes.buffer),
      };
      const decrypt = decryptSingleFragmentFactory(loader, CryptoDecryptor);
      const encryptionKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        "AES-CBC",
        false,
        ["encrypt"],
      );

      for (const [index, hex] of [firstIv, secondIv].entries()) {
        const plaintext = encoder.encode(`segment ${index}`);
        const ciphertext = await crypto.subtle.encrypt(
          { name: "AES-CBC", iv: Buffer.from(hex, "hex") },
          encryptionKey,
          plaintext,
        );
        const result = await decrypt(fragments[index].key, ciphertext, 3);

        expect(new Uint8Array(result)).toEqual(plaintext);
        expect(ivHex(fragments[index].key.iv)).toBe(hex);
      }
      expect(loader.fetchArrayBuffer).toHaveBeenCalledTimes(2);
      expect(loader.fetchArrayBuffer).toHaveBeenCalledWith(
        "https://example.com/key.bin",
        3,
      );
    },
  );

  it("counts media segments independently of clear initialization maps", () => {
    const fragments = M3u8Parser.parseLevelPlaylist(
      `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:42
#EXT-X-MAP:URI="init.mp4"
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXTINF:6,
first.m4s
#EXT-X-KEY:METHOD=NONE
#EXT-X-MAP:URI="init2.mp4"
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXTINF:6,
second.m4s
`,
      base,
    );

    expect(fragments.map((fragment) => fragment.index)).toEqual([0, 1, 2, 3]);
    expect(fragments[0].key).toEqual({ uri: null, iv: null });
    expect(fragments[2].key).toEqual({ uri: null, iv: null });
    expect(ivHex(fragments[1].key.iv)).toBe("0000000000000000000000000000002a");
    expect(ivHex(fragments[3].key.iv)).toBe("0000000000000000000000000000002b");
  });

  it("preserves the initialization map's explicit key and IV after key rotation", () => {
    const [init, media] = M3u8Parser.parseLevelPlaylist(
      `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:42
#EXT-X-KEY:METHOD=AES-128,URI="init.key",IV=0x00000000000000000000000000000020
#EXT-X-MAP:URI="init.mp4"
#EXT-X-KEY:METHOD=AES-128,URI="media.key"
#EXTINF:6,
first.m4s
`,
      base,
    );

    expect(init.key.uri).toBe("https://example.com/init.key");
    expect(ivHex(init.key.iv)).toBe("00000000000000000000000000000020");
    expect(media.key.uri).toBe("https://example.com/media.key");
    expect(ivHex(media.key.iv)).toBe("0000000000000000000000000000002a");
  });

  it("preserves an explicit IV across successive media segments", () => {
    const fragments = M3u8Parser.parseLevelPlaylist(
      `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:42
#EXT-X-KEY:METHOD=AES-128,URI="key.bin",IV=0x00000000000000000000000000000000
#EXTINF:6,
first.ts
#EXTINF:6,
second.ts
`,
      base,
    );

    expect(fragments.map((fragment) => ivHex(fragment.key.iv))).toEqual([
      "00000000000000000000000000000000",
      "00000000000000000000000000000000",
    ]);
  });

  it("keeps sequence numbering across clear segments, discontinuities, and key rotation", () => {
    const fragments = M3u8Parser.parseLevelPlaylist(
      `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:7
#EXT-X-KEY:METHOD=AES-128,URI="first.key"
#EXTINF:6,
first.ts
#EXT-X-KEY:METHOD=NONE
#EXTINF:6,
clear.ts
#EXT-X-DISCONTINUITY
#EXT-X-KEY:METHOD=AES-128,URI="second.key"
#EXTINF:6,
third.ts
`,
      base,
    );

    expect(ivHex(fragments[0].key.iv)).toBe("00000000000000000000000000000007");
    expect(fragments[1].key).toEqual({ uri: null, iv: null });
    expect(ivHex(fragments[2].key.iv)).toBe("00000000000000000000000000000009");
    expect(fragments[2].key.uri).toBe("https://example.com/second.key");
  });

  it("does not assign an AES-CBC IV to SAMPLE-AES segments", () => {
    const [fragment] = M3u8Parser.parseLevelPlaylist(
      `#EXTM3U
#EXT-X-KEY:METHOD=SAMPLE-AES,URI="key.bin"
#EXTINF:6,
first.ts
`,
      base,
    );

    expect(fragment.key.iv).toBeNull();
  });

  it.each(["18446744073709551616", "18446744073709551615"])(
    "rejects sequence %s instead of wrapping an implicit IV",
    (sequence) => {
      expect(() =>
        M3u8Parser.parseLevelPlaylist(
          `#EXTM3U
#EXT-X-MEDIA-SEQUENCE:${sequence}
#EXT-X-KEY:METHOD=AES-128,URI="key.bin"
#EXTINF:6,
first.ts
#EXTINF:6,
second.ts
`,
          base,
        ),
      ).toThrow("Media sequence must be an unsigned 64-bit integer");
    },
  );
});
