import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.@(ts|tsx)",
    "../../design-system/src/**/*.stories.@(ts|tsx)",
  ],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@hls-downloader/design-system": resolve(
            __dirname,
            "../../design-system/src",
          ),
          "@hls-downloader/core/lib": resolve(__dirname, "../../core/src"),
          "@hls-downloader/core": resolve(__dirname, "../../core/src"),
        },
      },
    });
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
