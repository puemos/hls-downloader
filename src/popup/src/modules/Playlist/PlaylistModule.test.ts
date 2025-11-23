import { describe, it, expect } from "vitest";
import { Level } from "@hls-downloader/core/lib/entities";
import { selectPreferredAudioLevel } from "./PlaylistModule";

const createAudioLevel = (id: string, props: Partial<Level> = {}): Level =>
  ({
    type: "audio",
    id,
    playlistID: "p1",
    uri: `${id}.m3u8`,
    ...props,
  } as Level);

describe("selectPreferredAudioLevel", () => {
  it("prefers languages in user priority list", () => {
    const levels = [
      createAudioLevel("a1", { language: "spa", isDefault: true }),
      createAudioLevel("a2", { language: "eng" }),
    ];

    const result = selectPreferredAudioLevel(levels, "eng");
    expect(result).toBe("a2");
  });

  it("falls back to default then autoselect", () => {
    const levels = [
      createAudioLevel("a1", { language: "deu", autoSelect: true }),
      createAudioLevel("a2", { language: "deu", isDefault: true }),
      createAudioLevel("a3", { language: "deu" }),
    ];

    const result = selectPreferredAudioLevel(levels, null);
    expect(result).toBe("a2");
  });
});
