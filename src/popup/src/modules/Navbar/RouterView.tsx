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
import DirectModule from "../Direct/DirectModule";

const RouterView = () => {
  const { tab, setTab } = useContext(RouterContext);

  return (
    <Tabs value={tab} defaultValue={tab} onValueChange={setTab}>
      <div className="flex justify-center">
        <TabsList className="mb-4">
          <TabsTrigger value={TabOptions.SNIFTER}>Sniffer</TabsTrigger>
          <TabsTrigger value={TabOptions.DIRECT}>Direct</TabsTrigger>
          <TabsTrigger value={TabOptions.DOWNLOADS}>Downloads</TabsTrigger>
          <TabsTrigger value={TabOptions.SETTINGS}>Settings</TabsTrigger>
          <TabsTrigger value={TabOptions.ABOUT}>About</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={TabOptions.SNIFTER}>
        <SnifferModule />
      </TabsContent>
      <TabsContent value={TabOptions.DIRECT}>
        <DirectModule />
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
