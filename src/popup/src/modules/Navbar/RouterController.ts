import { useState } from "react";
import { Tab, TabOptions } from "./types";
import { useLocalStorage } from "@hls-downloader/design-system";

const DEFAULT_TAB = TabOptions.SNIFTER;

interface ReturnType {
  tab: Tab;
  setTab: (tab: string) => void;
}

const useRouterController = (): ReturnType => {
  const [tab, setTab] = useLocalStorage("view", DEFAULT_TAB);

  function safeSetTab(tab: string) {
    if (
      [
        TabOptions.ABOUT,
        TabOptions.DOWNLOADS,
        TabOptions.SETTINGS,
        TabOptions.SNIFTER,
      ].includes(tab as Tab)
    ) {
      setTab(tab as Tab);
    } else {
      setTab(DEFAULT_TAB);
    }
  }

  return { tab, setTab: safeSetTab };
};

export default useRouterController;
