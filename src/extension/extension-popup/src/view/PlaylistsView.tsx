import { Box, IconButton, Input, Stack } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { Playlist, PlaylistStatus } from "@hls-downloader/core/lib/entities";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import PlaylistLevelsView from "./PlaylistLevelsView";
import { PlaylistRowView } from "./PlaylistRowView";

const PlaylistsView = () => {
  const [id, setId] = useState("");
  const [filter, setFilter] = useState("");
  const playlistsObj = useSelector<RootState, Record<string, Playlist | null>>(
    (state) => state.playlists.playlists
  );
  const playlistsStatusObj = useSelector<
    RootState,
    Record<string, PlaylistStatus | null>
  >((state) => state.playlists.playlistsStatus);
  function onFilterInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilter(e.target.value);
  }
  function onSelectPlaylistClick(playlistID: string) {
    setId(playlistID);
  }
  function playlistFilter(p: Playlist): boolean {
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
  }
  function isPlaylist(playlist: Playlist | null): playlist is Playlist {
    return playlist !== null;
  }
  const playlists = Object.values(playlistsObj)
    .filter(isPlaylist)
    .filter((playlist) => playlistsStatusObj[playlist.id]?.status === "ready")
    .filter(playlistFilter);

  return (
    <Stack spacing="1rem">
      {id === "" && (
        <Stack>
          <Input
            placeholder="Filter..."
            onChange={onFilterInputChange}
            value={filter}
          ></Input>

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
          <Stack isInline>
            <IconButton
              aria-label="close"
              icon="arrow-back"
              onClick={() => setId("")}
            ></IconButton>
          </Stack>

          <PlaylistLevelsView id={id} />
        </Stack>
      )}
    </Stack>
  );
};

export default PlaylistsView;
