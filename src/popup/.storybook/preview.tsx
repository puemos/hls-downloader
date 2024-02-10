import type { Preview } from "@storybook/react";
import React from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@hls-downloader/design-system";

import "../src/index.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <div id="browser-extension-template">
        <div
          id="hls-downloader-ext"
          className="z-[9999] w-[500px] h-[500px] rounded-md bg-white shadow-2xl transition-all p-4 font-sans text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-50"
        >
          <Tabs defaultValue={"home"}>
            <TabsList>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            <TabsContent value="home">
              <Story />
            </TabsContent>
            <TabsContent value="settings">
              <Story />
            </TabsContent>
            <TabsContent value="about">
              <Story />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    ),
  ],
};

export default preview;
