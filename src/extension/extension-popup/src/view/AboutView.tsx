import { Box, Link, Stack, Text } from "@chakra-ui/react";
import React from "react";
import { browser } from "webextension-polyfill-ts";

const AboutView = () => {
  return (
    <Stack spacing="1rem" p="1rem" pr="0rem">
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            <span
              aria-label="plant"
              role="img"
              style={{ marginRight: "0.5rem" }}
            >
              🌱
            </span>
            Version
          </Text>
        </Box>
        <Box>{browser.runtime.getManifest().version}</Box>
      </Stack>
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            <span
              aria-label="beer"
              role="img"
              style={{ marginRight: "0.5rem" }}
            >
              🍺
            </span>
            Donate
          </Text>
        </Box>
        <Box>
          <Link
            href="https://github.com/sponsors/puemos"
            color="#0070ba"
            isExternal
          >
            GitHub Sponsors
          </Link>
        </Box>
      </Stack>
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            <span aria-label="bug" role="img" style={{ marginRight: "0.5rem" }}>
              🐛
            </span>
            Bugs
          </Text>
        </Box>
        <Box>
          <Link
            isExternal
            href="https://github.com/puemos/hls-downloader-chrome-extension/issues"
            color="red.500"
          >
            Open an issue
          </Link>
        </Box>
      </Stack>
      <Stack
        p="1rem"
        rounded="lg"
        bg="gray.800"
        isInline
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            <span
              aria-label="books"
              role="img"
              style={{ marginRight: "0.5rem" }}
            >
              📚
            </span>
            Source code
          </Text>
        </Box>
        <Box>
          <Link
            isExternal
            color="blue.500"
            href="https://github.com/puemos/hls-downloader-chrome-extension"
          >
            Github
          </Link>
        </Box>
      </Stack>
    </Stack>
  );
};

export default AboutView;
