import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { DownloadIcon } from "@chakra-ui/icons";


export const LevelView = (props: { level: Level }) => {
  const dispatch = useDispatch();
  const { push } = useHistory();

  function onDownloadLevelClick() {
    dispatch(levelsSlice.actions.download({ levelID: props.level.id }));
    push("/downloads");
  }

  let metaData;
  if (props.level.type === 'stream') {
    metaData = (
      <Grid gridTemplateColumns="1.3fr 1fr 0.3fr" gridTemplateRows="1fr">
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">Stream</Text>
          {props.level.width && (
            <Text color="gray.400">
              {props.level.width}×{props.level.height}
            </Text>
          )}
        </Stack>
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">Bitrate</Text>
          <Text color="gray.400">{((props.level?.bitrate || 0) / 1024 / 1024).toFixed(1)} mbps</Text>
        </Stack>
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">FPS</Text>
          <Text color="gray.400">{props.level.fps}</Text>
        </Stack>
      </Grid>
    );
  } else if (props.level.type === 'audio') {
    metaData = (
      <Grid gridTemplateColumns="1.3fr 1fr 0.3fr" gridTemplateRows="1fr">
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">Audio</Text>
          <Text color="gray.400">{props.level.id}</Text>
        </Stack>
      </Grid>
    );
  } else {
    throw new TypeError('invalid type');
  }
  return (
    <Grid
      rounded="lg"
      p="1rem"
      templateColumns="minmax(0, 1fr) 2.5rem"
      gap={6}
      bg="gray.800"
    >
      <Stack>
        {metaData}
        <Box>
          <Input
            size="sm"
            borderColor="#99a3ff45"
            isReadOnly
            value={props.level.uri}
          />
        </Box>
      </Stack>
      <Stack justify="space-between">
        <IconButton
          icon={<DownloadIcon />}
          aria-label="download"
          onClick={onDownloadLevelClick}
        />
      </Stack>
    </Grid>
  );
};
