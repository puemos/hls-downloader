import { Box, Button, Input, Stack } from "@chakra-ui/core";
import { playlistsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import PlaylistView from "./PlaylistView";

function App() {
  const dispatch = useDispatch();
  const [uri, setURI] = useState(
    "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
  );
  function onURIInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setURI(e.target.value);
  }
  function onDownloadPlaylistClick() {
    dispatch(
      playlistsSlice.actions.fetchPlaylistLevels({
        playlistID: uri,
        uri,
      })
    );
  }
  return (
    <Box bg="gray.800" m="2rem">
      <Stack isInline>
        <Input type="text" onChange={onURIInputChange} value={uri} />
        <Button onClick={() => onDownloadPlaylistClick()}>Fetch</Button>
      </Stack>
      <Box h="3rem"></Box>
      <PlaylistView id={uri} />
    </Box>
  );
}

export default App;
