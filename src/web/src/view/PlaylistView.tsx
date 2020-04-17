import { Box, SimpleGrid, Spinner } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { Level, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useSelector } from "react-redux";
import { LevelView } from "./LevelView";

const PlaylistView = (props: { id: string }) => {
  const status = useSelector<RootState, PlaylistStatus | null>(
    (state) => state.playlists.playlistsStatus[props.id]
  );
  const levels = useSelector<RootState, (Level | null)[]>((state) =>
    Object.values(state.levels.levels)
  );
  const playlistLevels = levels
    .filter(Boolean)
    .filter((l) => l?.playlistID === props.id);
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
      <SimpleGrid columns={3} spacing="0.5rem">
        {playlistLevels.map((level) => (
          <Box>
            <LevelView level={level!} />
          </Box>
        ))}
      </SimpleGrid>
    );
  }

  return null;
};

export default PlaylistView;
