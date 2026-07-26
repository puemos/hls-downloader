import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@hls-downloader/design-system";
import React, { useContext } from "react";
import AboutModule from "../About/AboutModule";
import DownloadsModule from "../Downloads/DownloadsModule";
import SettingsModule from "../Settings/SettingsModule";
import SnifferModule from "../Sniffer/SnifferModule";
import { RouterContext } from "./RouterContext";
import { TabOptions } from "./types";
import { Download, Info, Search, SlidersHorizontal } from "lucide-react";
import { useStorageInfo } from "../../hooks/useStorageInfo";
import StorageBanner from "../Storage/StorageBanner";

const tabPanelClassName =
  "mt-0 min-h-0 flex-1 overflow-hidden data-[state=active]:block";

const RouterView = () => {
  const { tab, setTab } = useContext(RouterContext);
  const { storage, startCleanup } = useStorageInfo();

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
      <h1 className="sr-only">HLS Downloader</h1>
      <StorageBanner
        visible={storage.nearQuota}
        usedBytes={storage.totalUsedBytes}
        availableBytes={storage.availableBytes}
        cleanupStatus={storage.cleanupStatus}
        onCleanup={startCleanup}
      />
      <Tabs
        value={tab}
        defaultValue={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsContent value={TabOptions.SNIFTER} className={tabPanelClassName}>
          <SnifferModule />
        </TabsContent>
        <TabsContent value={TabOptions.DOWNLOADS} className={tabPanelClassName}>
          <DownloadsModule />
        </TabsContent>
        <TabsContent value={TabOptions.SETTINGS} className={tabPanelClassName}>
          <SettingsModule />
        </TabsContent>
        <TabsContent value={TabOptions.ABOUT} className={tabPanelClassName}>
          <AboutModule />
        </TabsContent>
        <TabsList className="grid h-[60px] w-full shrink-0 grid-cols-4 border-x-0 border-b-0 border-t bg-card/95 px-3 py-1 backdrop-blur-xl">
          <TabsTrigger
            value={TabOptions.SNIFTER}
            className="group flex h-[52px] flex-col gap-0.5 rounded-[10px] px-1 text-[10px] font-semibold tracking-[-0.01em] data-[state=active]:bg-transparent"
          >
            <span className="grid h-7 w-10 place-items-center rounded-[9px] group-data-[state=active]:bg-primary/10">
              <Search className="h-[18px] w-[18px]" />
            </span>
            Capture
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.DOWNLOADS}
            className="group flex h-[52px] flex-col gap-0.5 rounded-[10px] px-1 text-[10px] font-semibold tracking-[-0.01em] data-[state=active]:bg-transparent"
          >
            <span className="grid h-7 w-10 place-items-center rounded-[9px] group-data-[state=active]:bg-primary/10">
              <Download className="h-[18px] w-[18px]" />
            </span>
            Downloads
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.SETTINGS}
            className="group flex h-[52px] flex-col gap-0.5 rounded-[10px] px-1 text-[10px] font-semibold tracking-[-0.01em] data-[state=active]:bg-transparent"
          >
            <span className="grid h-7 w-10 place-items-center rounded-[9px] group-data-[state=active]:bg-primary/10">
              <SlidersHorizontal className="h-[18px] w-[18px]" />
            </span>
            Settings
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.ABOUT}
            className="group flex h-[52px] flex-col gap-0.5 rounded-[10px] px-1 text-[10px] font-semibold tracking-[-0.01em] data-[state=active]:bg-transparent"
          >
            <span className="grid h-7 w-10 place-items-center rounded-[9px] group-data-[state=active]:bg-primary/10">
              <Info className="h-[18px] w-[18px]" />
            </span>
            About
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default RouterView;
