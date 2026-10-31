import { Level } from "../entities";

export function selectPreferredAudioLevel(
  audioLevels: Level[] = [],
  preferredLanguage?: string | null,
): string | undefined {
  const language = preferredLanguage?.toLowerCase();
  const score = (level: Level) =>
    (language && level.language?.toLowerCase() === language ? 4 : 0) +
    (level.isDefault ? 2 : 0) +
    (level.autoSelect ? 1 : 0);
  return [...audioLevels].sort((a, b) => score(b) - score(a))[0]?.id;
}
