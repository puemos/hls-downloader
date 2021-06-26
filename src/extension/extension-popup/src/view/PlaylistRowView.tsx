import { Box, Grid, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import { Playlist } from "@hls-downloader/core/lib/entities";
import React from "react";
import { ArrowForwardIcon } from "@chakra-ui/icons";

export function PlaylistRowView(props: {
  onSelectPlaylistClick: (playlistID: string) => void;
  playlist: Playlist;
}): JSX.Element {
  return (
    <Grid
      rounded="lg"
      bg="gray.800"
      p="1rem"
      templateColumns="minmax(0, 1fr) 2.5rem"
      gap={6}
    >
      <Stack>
        <Stack isInline>
          <Text color="#99a3ff" isTruncated mr="4px">
            {props.playlist.pageTitle}
          </Text>
          <Text width="9rem" color="gray.400" isTruncated>
            {"· "}
            {new Date(props.playlist.createdAt!).toLocaleString()}
          </Text>
        </Stack>

        <Box>
          <Input
            size="sm"
            borderColor="#99a3ff45"
            isReadOnly
            value={props.playlist.uri}
          />
        </Box>
      </Stack>
      <Stack justify="space-between">
        <Stack isInline justifyContent="flex-end">
          <IconButton
            icon={<ArrowForwardIcon/>}
            aria-label="download"
            onClick={() => props.onSelectPlaylistClick(props.playlist.id)}
          />
        </Stack>
      </Stack>
    </Grid>
  );
}
