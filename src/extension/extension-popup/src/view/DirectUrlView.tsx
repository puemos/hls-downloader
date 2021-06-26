import {
  Box,
  Button,
  Heading,
  IconButton,
  Input,
  Stack,
} from "@chakra-ui/react";
import {
  playlistsSlice,
  levelsSlice,
} from "@hls-downloader/core/lib/adapters/redux/slices";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import PlaylistLevelsView from "../view/PlaylistLevelsView";
import { ArrowBackIcon } from "@chakra-ui/icons";

const DirectUrlView = () => {
  const dispatch = useDispatch();
  const [url, setUrl] = useState("");
  const [id, setId] = useState("");

  function onURLInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUrl(e.target.value);
  }

  const addPlaylist = () => {
    dispatch(
      levelsSlice.actions.removePlaylistLevels({
        playlistID: url,
      })
    );
    dispatch(
      playlistsSlice.actions.addPlaylist({
        id: url,
        uri: url,
        initiator: "manual",
        pageTitle: "Direct Url",
        createdAt: Date.now(),
      })
    );
    setId(url);
  };

  return (
    <Stack spacing="1rem" pl="1rem" pr="0rem" pb="2rem">
      {id === "" && (
        <Stack spacing="1rem">
          <Stack>
            <Box>
              <Input
                placeholder="M3U8 Playlist URL"
                onChange={onURLInputChange}
                value={url}
              />
            </Box>
          </Stack>
          <Stack alignItems="center">
            <Box>
              <Button onClick={addPlaylist}>Send</Button>
            </Box>
          </Stack>
        </Stack>
      )}
      {id && (
        <Stack>
          <Stack isInline alignItems="center">
            <IconButton
              variant="ghost"
              aria-label="close"
              icon={<ArrowBackIcon />}
              onClick={() => setId("")}
            ></IconButton>
            <Heading lineHeight={1} size="md">
              {"Direct Url"}
            </Heading>
          </Stack>

          <PlaylistLevelsView id={id} />
        </Stack>
      )}
    </Stack>
  );
};

export default DirectUrlView;
