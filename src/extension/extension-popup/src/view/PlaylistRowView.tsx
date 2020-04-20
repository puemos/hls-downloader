import { Box, Grid, IconButton, Stack, Text, Input } from "@chakra-ui/core";
import { Playlist } from "@hls-downloader/core/lib/entities";
import React from "react";

export function PlaylistRowView(props: {
  onSelectPlaylistClick: (playlistID: string) => void;
  playlist: Playlist;
}): JSX.Element {
  return (
    <Grid
      rounded="lg"
      bg="gray.800"
      p="1rem"
      templateColumns="minmax(0, 1fr) 60px"
      gap={6}
    >
      <Stack>
        <Box>
          <Input isReadOnly value={props.playlist.uri} />
        </Box>
        <Box pl="1.1rem">
          <Text fontWeight="semibold" isTruncated>
            {props.playlist.pageTitle}
          </Text>
        </Box>
        <Box pl="1.1rem">
          <Text color="gray.400" fontWeight="semibold" isTruncated>
            Initiator: {props.playlist.initiator}
          </Text>
        </Box>
      </Stack>
      <Stack justify="space-between">
        <Stack isInline justifyContent="flex-end">
          <IconButton
            icon="arrow-forward"
            aria-label="download"
            onClick={() => props.onSelectPlaylistClick(props.playlist.id)}
          />
        </Stack>
      </Stack>
    </Grid>
  );
}
