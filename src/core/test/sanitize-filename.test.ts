import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "../src/use-cases/sanitize-filename";
import { generateFileName } from "../src/use-cases/generate-file-name";
import { generateSubtitleFileName } from "../src/use-cases/generate-subtitle-file-name";
import { Level, Playlist } from "../src/entities";

describe("sanitizeFilename", () => {
  it.each([
    ['Video "Test" <2024>/a\\b|?*', "Video _Test_ _2024__a_b___"],
    ["映画『トランジット・デイズ』🏳️‍⚧️", "映画『トランジット・デイズ』🏳️⚧️"],
    [
      "映画『トランジット・デイズ』🏳️‍⚧️#映画トラデイ",
      "映画『トランジット・デイズ』🏳️⚧️#映画トラデイ",
    ],
    ["Developer 👩‍💻", "Developer 👩💻"],
    ["日本語 😀 Café", "日本語 😀 Café"],
    ["Cafe\u0301", "Café"],
    ["one\n\t two", "one two"],
    ["a\u0000\u007fb\u200c\u200d\u202e\u2066c", "abc"],
    ["a\ufdd0b\ufffec\u{1ffff}d", "abcd"],
    ["  ...~ video.mp4 ~.  ", "video.mp4"],
    ["\u200d\u202e", ""],
  ])("sanitizes %j", (input, expected) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });

  it("uses safe Unicode titles for both media and subtitles", () => {
    const playlist = new Playlist(
      "playlist",
      "https://video.twimg.com/stream.m3u8",
      0,
      "映画 🏳️‍⚧️",
    );
    const level = new Level("stream", "level", "playlist", "stream.m3u8");

    expect(generateFileName()(playlist, level)).toBe("映画 🏳️⚧️-stream.mp4");
    expect(generateFileName()(playlist, level, { container: "mkv" })).toBe(
      "映画 🏳️⚧️-stream.mkv",
    );
    expect(generateSubtitleFileName()(playlist, level)).toBe(
      "映画 🏳️⚧️-level.vtt",
    );
  });
});
