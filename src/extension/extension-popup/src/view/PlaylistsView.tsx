import { Box, IconButton, Input, Stack, Heading, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import PlaylistLevelsView from "./PlaylistLevelsView";
import { PlaylistRowView } from "./PlaylistRowView";

const playlistFilter = (filter: string) => (p: Playlist): boolean => {
  const filterLowerCase = filter.toLocaleLowerCase();
  if (filterLowerCase === "") {
    return true;
  }
  if (p.uri.toLocaleLowerCase().includes(filterLowerCase)) {
    return true;
  }
  if (p.pageTitle?.toLocaleLowerCase().includes(filterLowerCase)) {
    return true;
  }
  if (p.initiator?.toLocaleLowerCase().includes(filterLowerCase)) {
    return true;
  }
  return false;
};

const PlaylistsView = () => {
  const [id, setId] = useState("");
  const [filter, setFilter] = useState("");

  const playlistsRecord = useSelector<
    RootState,
    Record<string, Playlist | null>
  >((state) => state.playlists.playlists);
  const playlistsStatusRecord = useSelector<
    RootState,
    Record<string, PlaylistStatus | null>
  >((state) => state.playlists.playlistsStatus);

  function onFilterInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilter(e.target.value);
  }
  function onSelectPlaylistClick(playlistID: string) {
    setId(playlistID);
  }

  function isPlaylist(playlist: Playlist | null): playlist is Playlist {
    return playlist !== null;
  }
  const playlists = Object.values(playlistsRecord)
    .filter(isPlaylist)
    .filter(
      (playlist) => playlistsStatusRecord[playlist.id]?.status === "ready"
    )
    .filter(playlistFilter(filter));

  playlists.sort((a, b) => b.createdAt - a.createdAt);
  return (
    <Stack spacing="1rem" pl="1rem" pr="0rem" pb="2rem">
      {id === "" && (
        <Stack>
          <Stack isInline alignItems="center" justifyContent="space-between">
            <Box>
              <Heading lineHeight={1} size="md">
                Playlists
              </Heading>
            </Box>
            <Box width={1 / 3}>
              <Input
                placeholder="Filter..."
                onChange={onFilterInputChange}
                value={filter}
              />
            </Box>
          </Stack>
          {playlists.length === 0 && (
            <Box>
              <Text>No playlist were found</Text>
            </Box>
          )}
          {playlists.map((playlist) => (
            <Box>
              <PlaylistRowView
                playlist={playlist}
                onSelectPlaylistClick={onSelectPlaylistClick}
              />
            </Box>
          ))}
        </Stack>
      )}
      {id !== "" && (
        <Stack>
          <Stack isInline alignItems="center">
            <IconButton
              variant="ghost"
              aria-label="close"
              icon="arrow-back"
              onClick={() => setId("")}
            ></IconButton>
            <Heading lineHeight={1} size="md">
              {playlistsRecord[id]?.pageTitle}
            </Heading>
          </Stack>

          <PlaylistLevelsView id={id} />
        </Stack>
      )}
    </Stack>
  );
};

export default PlaylistsView;
