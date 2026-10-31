import { Job, Level } from "../entities";
import { IDecryptor, ILoader, IParser } from "../services";
import { getFragmentsDetailsFactory } from "./get-fragments-details";
import { getSubtitleTextFactory } from "./get-subtitle-text";

export const prepareJobFactory = (
  loader: ILoader,
  parser: IParser,
  decryptor: IDecryptor,
) => {
  return async (job: Job, attempts: number): Promise<Job> => {
    if (!job.source) return job;
    const { playlist, video, audio, subtitle } = job.source;
    const options = { baseUri: playlist.uri };
    const requiredFragments = async (level: Level, track: string) => {
      const fragments = await getFragmentsDetailsFactory(loader, parser)(
        level,
        attempts,
        options,
      );
      if (!fragments.length)
        throw new Error(
          `Selected ${track} playlist contains no media segments`,
        );
      return fragments;
    };
    const [videoFragments, audioFragments, subtitleText] = await Promise.all([
      requiredFragments(video, "stream"),
      audio ? requiredFragments(audio, "audio") : Promise.resolve([]),
      subtitle
        ? getSubtitleTextFactory(loader, parser, decryptor)(
            subtitle,
            attempts,
            options,
          )
        : Promise.resolve(undefined),
    ]);
    return {
      ...job,
      videoFragments,
      audioFragments,
      subtitleText,
      subtitleLanguage: subtitle?.language,
      subtitleName: subtitle?.name,
    };
  };
};
