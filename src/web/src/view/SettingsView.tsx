import { IconButton, Stack, Input } from "@chakra-ui/core";
import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { configSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

const SettingsView = () => {
  const dispatch = useDispatch();
  const concurrency = useSelector<RootState, number>(
    (state) => state.config.concurrency
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

  return (
    <Stack isInline>
      <Input isDisabled value={concurrency}></Input>
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
  );
};

export default SettingsView;
