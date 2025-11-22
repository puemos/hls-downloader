import { Level } from "../entities";
import { ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";

export const getSubtitleTextFactory = (loader: ILoader, parser: IParser) => {
  const run = async (level: Level, fetchAttempts: number): Promise<string> => {
    const fragments = await getFragmentsDetailsFactory(loader, parser)(
      level,
      fetchAttempts,
    );

    const parts: string[] = [];

    if (fragments.length > 0) {
      for (const fragment of fragments) {
        const fragmentText = await loader.fetchText(
          fragment.uri,
          fetchAttempts,
        );
        parts.push(fragmentText.trim());
      }
    } else {
      const text = await loader.fetchText(level.uri, fetchAttempts);
      parts.push(text.trim());
    }

    return parts.join("\n\n");
  };

  return run;
};
