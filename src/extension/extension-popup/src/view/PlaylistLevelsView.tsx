import { Box, Spinner, Stack } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useSelector } from "react-redux";
import { LevelView } from "./LevelView";

const PlaylistLevelsView = (props: { id: string }) => {
  const status = useSelector<RootState, PlaylistStatus | null>(
    (state) => state.playlists.playlistsStatus[props.id]
  );
  const levels = useSelector<RootState, (Level | null)[]>((state) =>
    Object.values(state.levels.levels)
  );
  const playlistLevels = levels
    .filter(Boolean)
    .filter((l) => l?.playlistID === props.id);

  playlistLevels.sort((a, b) => b?.bitrate! - a?.bitrate!);

  if (!status) {
    return null;
  }
  if (status.status === "fetching") {
    return (
      <Box>
        <Spinner />
      </Box>
    );
  }
  if (status.status === "ready") {
    return (
      <Stack spacing="0.5rem">
        {playlistLevels.map((level) => (
          <Box>
            <LevelView level={level!} />
          </Box>
        ))}
      </Stack>
    );
  }

  return null;
};

export default PlaylistLevelsView;
