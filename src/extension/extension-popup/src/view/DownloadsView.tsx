import { Box, Stack, Text, Heading } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import {
  Level,
  LevelStatus,
  Playlist,
} from "@hls-downloader/core/lib/entities";
import React from "react";
import { useSelector } from "react-redux";
import { LevelView } from "./LevelView";

const DownloadsView = () => {
  const levels = useSelector<RootState, (Level | null)[]>((state) =>
    Object.values(state.levels.levels)
  );
  const playlists = useSelector<RootState, Record<string, Playlist | null>>(
    (state) => state.playlists.playlists
  );
  const levelsStatus = useSelector<
    RootState,
    Record<string, LevelStatus | null>
  >((state) => state.levels.levelsStatus);
  const activeLevels = levels
    .filter(Boolean)
    .filter((l) => levelsStatus[l?.id!]?.status !== "init");

  const getPlaylistCreatedAt = (l: Level) => playlists[l.playlistID]!.createdAt;
  const getPlaylistTitle = (l: Level) => playlists[l.playlistID]!.pageTitle;

  activeLevels.sort(
    (a, b) => getPlaylistCreatedAt(b!) - getPlaylistCreatedAt(a!)
  );

  return (
    <Stack spacing="1rem" pl="1rem" pr="0rem" pb="2rem">
      <Stack isInline alignItems="center" justifyContent="space-between">
        <Box>
          <Heading lineHeight={1} size="md">
            Active downloads
          </Heading>
        </Box>
      </Stack>
      {activeLevels.length === 0 && (
        <Box>
          <Text>No active downlaods</Text>
        </Box>
      )}
      {activeLevels.map((level) => (
        <Stack>
          <Text>{getPlaylistTitle(level!)}</Text>
          <LevelView level={level!} />
        </Stack>
      ))}
    </Stack>
  );
};

export default DownloadsView;
