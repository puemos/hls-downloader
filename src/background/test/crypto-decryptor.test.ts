import { describe, it, expect, vi } from "vitest";
import { decrypt } from "../src/services/crypto-decryptor";

// Helper to convert string to ArrayBuffer
const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe("CryptoDecryptor", () => {
  it("decrypts data using AES-CBC", async () => {
    const keyData = new Uint8Array([
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0x0c, 0x0d, 0x0e, 0x0f,
    ]);
    const iv = new Uint8Array([
      0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b,
      0x1c, 0x1d, 0x1e, 0x1f,
    ]);
    const plaintext = encoder.encode("0123456789ABCDEF");

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      "aes-cbc",
      false,
      ["encrypt"]
    );
    const encrypted = await crypto.subtle.encrypt(
      { name: "aes-cbc", iv },
      cryptoKey,
      plaintext
    );

    const decrypted = await decrypt(encrypted, keyData.buffer, iv);
    const decoded = decoder.decode(decrypted);
    expect(decoded).toBe("0123456789ABCDEF");
  });

  it("propagates errors from importKey", async () => {
    const importSpy = vi
      .spyOn(crypto.subtle, "importKey")
      .mockRejectedValue(new Error("import failure"));

    await expect(
      decrypt(new ArrayBuffer(0), new ArrayBuffer(16), new Uint8Array(16))
    ).rejects.toThrow("import failure");

    importSpy.mockRestore();
  });

  it("propagates errors from decrypt", async () => {
    const importSpy = vi
      .spyOn(crypto.subtle, "importKey")
      .mockResolvedValue({} as CryptoKey);
    const decryptSpy = vi
      .spyOn(crypto.subtle, "decrypt")
      .mockRejectedValue(new Error("decrypt failure"));

    await expect(
      decrypt(new ArrayBuffer(0), new ArrayBuffer(16), new Uint8Array(16))
    ).rejects.toThrow("decrypt failure");

    importSpy.mockRestore();
    decryptSpy.mockRestore();
  });
});
