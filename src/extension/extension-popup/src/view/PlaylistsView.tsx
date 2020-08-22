import {
  Box,
  Button,
  Heading,
  IconButton,
  Input,
  Stack,
} from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import {
  levelsSlice,
  playlistsSlice,
} from "@hls-downloader/core/lib/adapters/redux/slices";
import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EmptyState } from "./EmptyState";
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
  const [id, setId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const dispatch = useDispatch();
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
  function onClearClick() {
    dispatch(levelsSlice.actions.clear());
    dispatch(playlistsSlice.actions.clearPlaylists());
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
      {id === null && (
        <Stack>
          <Stack isInline alignItems="center" justifyContent="space-between">
            <Box>
              <Heading lineHeight={1} size="md">
                Playlists
              </Heading>
            </Box>
            {playlists.length !== 0 && (
              <>
                <Box>
                  <Input
                    placeholder="Filter..."
                    onChange={onFilterInputChange}
                    value={filter}
                  />
                </Box>
                <Box>
                  <Button onClick={onClearClick}>Clear</Button>
                </Box>
              </>
            )}
          </Stack>
          {playlists.length === 0 && (
            <EmptyState caption="Sorry, I coun't find any playlists" />
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
      {id && (
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
