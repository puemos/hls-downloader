import { Box, Button, Input, Stack } from "@chakra-ui/core";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import PlaylistLevelsView from "./PlaylistLevelsView";

const PlaylistView = () => {
  const dispatch = useDispatch();
  const [uri, setURI] = useState(
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
  );
  function onURIInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setURI(e.target.value);
  }
  function onDownloadPlaylistClick() {
    dispatch(
      playlistsSlice.actions.addPlaylist({
        playlistID: uri,
        uri,
      })
    );
    dispatch(
      playlistsSlice.actions.fetchPlaylistLevels({
        playlistID: uri,
      })
    );
  }
  return (
    <Box>
      <Stack isInline>
        <Input type="text" onChange={onURIInputChange} value={uri} />
        <Button onClick={() => onDownloadPlaylistClick()}>Fetch</Button>
      </Stack>
      <Box h="3rem"></Box>
      <PlaylistLevelsView id={uri} />
    </Box>
  );
};

export default PlaylistView;
