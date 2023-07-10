import { Grid, Stack, Text } from "@chakra-ui/react";
import { Level } from "@hls-downloader/core/lib/entities";
import React from "react";

export function LevelMetadata(props: { level: Level }) {
  if (props.level.type === "stream") {
    return (
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
          <Text color="gray.400">
            {((props.level?.bitrate || 0) / 1024 / 1024).toFixed(1)} mbps
          </Text>
        </Stack>
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">FPS</Text>
          <Text color="gray.400">{props.level.fps}</Text>
        </Stack>
      </Grid>
    );
  }
  if (props.level.type === "audio") {
    return (
      <Grid gridTemplateColumns="1.3fr 1fr 0.3fr" gridTemplateRows="1fr">
        <Stack isInline spacing="0.4rem">
          <Text color="#99a3ff">Audio</Text>
          <Text color="gray.400">{props.level.id}</Text>
        </Stack>
      </Grid>
    );
  }
  return null;
}
