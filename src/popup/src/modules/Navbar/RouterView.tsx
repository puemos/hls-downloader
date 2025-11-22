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
import { Search, Download, Settings, Info } from "lucide-react";

const RouterView = () => {
  const { tab, setTab } = useContext(RouterContext);

  return (
    <Tabs value={tab} defaultValue={tab} onValueChange={setTab}>
      <div className="flex justify-center">
        <TabsList>
          <TabsTrigger
            value={TabOptions.SNIFTER}
            className="flex items-center gap-1"
          >
            <Search className="h-4 w-4" />
            Sniffer
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.DOWNLOADS}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Downloads
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.SETTINGS}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger
            value={TabOptions.ABOUT}
            className="flex items-center gap-1"
          >
            <Info className="h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={TabOptions.SNIFTER}>
        <SnifferModule />
      </TabsContent>
      <TabsContent value={TabOptions.DOWNLOADS}>
        <DownloadsModule />
      </TabsContent>
      <TabsContent value={TabOptions.SETTINGS}>
        <SettingsModule />
      </TabsContent>
      <TabsContent value={TabOptions.ABOUT}>
        <AboutModule />
      </TabsContent>
    </Tabs>
  );
};

export default RouterView;
