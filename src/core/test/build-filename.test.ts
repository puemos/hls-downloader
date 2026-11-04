import { describe, expect, it } from "vitest";
import {
  MAX_FILENAME_LENGTH,
  buildFilename,
  containerFromFilename,
  finalizeFilename,
} from "../src/use-cases/build-filename";
import { generateFileName } from "../src/use-cases/generate-file-name";
import { generateSubtitleFileName } from "../src/use-cases/generate-subtitle-file-name";
import { renameJobFilename } from "../src/use-cases/rename-job-filename";
import { Level, Playlist } from "../src/entities";

const longTitle = "A Very Long Page Title ".repeat(10).trim();

describe("buildFilename", () => {
  it("adds the extension once", () => {
    expect(buildFilename("Episode 3", "mp4")).toBe("Episode 3.mp4");
    expect(buildFilename("Episode 3.MP4", "mp4")).toBe("Episode 3.mp4");
    expect(buildFilename("Episode 3.mkv", "mp4")).toBe("Episode 3.mkv.mp4");
  });

  it("sanitizes the name", () => {
    expect(buildFilename(' a/b: "c" ', "mkv")).toBe("a_b_ _c_.mkv");
  });

  it("returns undefined when nothing usable is left", () => {
    expect(buildFilename("   ", "mp4")).toBeUndefined();
    expect(buildFilename("...", "mp4")).toBeUndefined();
  });

  it("shortens long names and keeps the extension", () => {
    const filename = buildFilename(longTitle, "mp4")!;
    expect(filename.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
    expect(filename.endsWith(".mp4")).toBe(true);
    expect(longTitle.startsWith(filename.slice(0, -4))).toBe(true);
  });

  it("renames reserved names", () => {
    expect(buildFilename("CON", "mp4")).toBe("CON!.mp4");
    expect(buildFilename("nul.mkv", "mkv")).toBe("nul!.mkv");
  });

  it("does not split an emoji when shortening", () => {
    const flag = "🏳️⚧️";
    const name = "a".repeat(MAX_FILENAME_LENGTH - 6) + flag;
    expect(buildFilename(name, "mp4")).toBe(
      `${"a".repeat(MAX_FILENAME_LENGTH - 6)}.mp4`,
    );
  });
});

describe("finalizeFilename", () => {
  it.each([
    "CON.mp4",
    longTitle + ".mp4",
    `${"a".repeat(MAX_FILENAME_LENGTH - 6)} . b.mp4`,
    "映画 🏳️‍⚧️-ja.vtt",
    "😀".repeat(100) + ".mkv",
  ])("leaves its own result unchanged for %j", (name) => {
    const filename = finalizeFilename(name);
    expect(filename.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
    expect(finalizeFilename(filename)).toBe(filename);
  });

  it("uses the fallback when nothing usable is left", () => {
    expect(finalizeFilename("\u200d\u202e")).toBe("stream.mp4");
  });
});

describe("saving a shown name again", () => {
  // The rename field shows the name without its extension.
  const resave = (filename: string) =>
    renameJobFilename(filename, filename.replace(/\.(mp4|mkv)$/i, ""));

  it.each([
    ["a cut after a stray dot", `${"a".repeat(MAX_FILENAME_LENGTH - 6)} . b`],
    ["a cut on a copy of the extension", `${"a".repeat(72)}.mp4.mp4 tail`],
    ["a repeated extension", "Episode.mp4.mp4"],
    ["a reserved name", "CON"],
    ["a long reserved name", "aux." + "b".repeat(100)],
    ["characters removed next to spaces", "a \u200c\u200c b"],
  ])("keeps %s unchanged", (_case, name) => {
    const filename = renameJobFilename("video.mp4", name)!;
    expect(filename.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
    expect(finalizeFilename(filename)).toBe(filename);
    expect(resave(filename)).toBe(filename);
  });

  it("drops the dot filenamify leaves when it cuts the name", () => {
    expect(
      renameJobFilename(
        "video.mp4",
        `${"a".repeat(MAX_FILENAME_LENGTH - 6)} . b`,
      ),
    ).toBe(`${"a".repeat(MAX_FILENAME_LENGTH - 6)}.mp4`);
  });
});

describe("containerFromFilename", () => {
  it("reads the container from the extension", () => {
    expect(containerFromFilename("video.MKV")).toBe("mkv");
    expect(containerFromFilename("video.mp4")).toBe("mp4");
    expect(containerFromFilename("video")).toBe("mp4");
  });
});

describe("filename rules are shared", () => {
  const level = new Level("stream", "l", "1", "uri");

  it("limits generated, renamed and subtitle names the same way", () => {
    const playlist = new Playlist(
      "1",
      "https://a/b/index.m3u8",
      Date.now(),
      longTitle,
    );
    const subtitleLevel = new Level(
      "subtitle",
      "English",
      "1",
      "uri",
      undefined,
      undefined,
      undefined,
      undefined,
      "en",
    );

    const generated = generateFileName()(playlist, level);
    const renamed = renameJobFilename("video.mp4", longTitle)!;
    const subtitle = generateSubtitleFileName()(playlist, subtitleLevel);

    for (const filename of [generated, renamed, subtitle]) {
      expect(filename.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH);
    }
    expect(generated.endsWith(".mp4")).toBe(true);
    expect(renamed).toBe(generated);
    expect(subtitle.endsWith(".vtt")).toBe(true);
  });

  it("sanitizes the playlist part of a generated name", () => {
    const playlist = new Playlist("1", "https://a/b/c:d.m3u8", Date.now());
    expect(generateFileName()(playlist, level)).toBe("c_d.mp4");
  });

  it("falls back to the playlist name when the title sanitizes to nothing", () => {
    const playlist = new Playlist(
      "1",
      "https://a/b/c.m3u8",
      Date.now(),
      "\u200d",
    );
    expect(generateFileName()(playlist, level)).toBe("c.mp4");
  });
});
