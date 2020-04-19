import { Box, Flex, IconButton, Stack, Switch, Text } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const SettingsView = () => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
  );
  const autoSave = useSelector<RootState, boolean>(
    (state) => state.config.autoSave
  );
  function onConcurrencyIncrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: concurrency + 1,
      })
    );
  }
  function onConcurrencyDecrease() {
    dispatch(
      configSlice.actions.setConcurrency({
        concurrency: Math.max(1, concurrency - 1),
      })
    );
  }
  function onAutoSave() {
    dispatch(
      configSlice.actions.setAutosave({
        autoSave: !autoSave,
      })
    );
  }

  return (
    <Stack spacing="1rem" p="2rem">
      <Stack isInline justifyContent="space-between" alignItems="center">
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            Concurrency
          </Text>
        </Box>
        <Stack isInline>
          <Flex
            width="5rem"
            height="2.5rem"
            pl="16px"
            pr="16px"
            justifyContent="center"
            alignItems="center"
            borderRadius="0.25rem"
            bg="gray.700"
          >
            <Text fontSize="md" fontWeight="semibold">
              {concurrency}
            </Text>
          </Flex>
          <IconButton
            icon="add"
            aria-label="increase concurrency"
            onClick={onConcurrencyIncrease}
          ></IconButton>
          <IconButton
            icon="minus"
            aria-label="decrease concurrency"
            onClick={onConcurrencyDecrease}
          ></IconButton>
        </Stack>
      </Stack>
      <Stack isInline justifyContent="space-between" alignItems="center">
        <Box>
          <Text fontSize="md" fontWeight="semibold">
            Enable auto save?
          </Text>
        </Box>
        <Box>
          <Switch onClick={onAutoSave} isChecked={autoSave} size="lg" />
        </Box>
      </Stack>
    </Stack>
  );
};

export default SettingsView;
