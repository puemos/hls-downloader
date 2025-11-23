import { Button } from "@hls-downloader/design-system";
import {
  Bug,
  Github,
  Lock,
  Scroll,
  Code2,
  Info,
  ExternalLink,
} from "lucide-react";
import React from "react";

interface Props {
  version: string;
  name: string;
  description: string;
}

const AboutView = ({ version, name, description }: Props) => {
  const open = (url: string) => {
    const browserTabs = (globalThis as any)?.browser?.tabs;
    const chromeTabs = (globalThis as any)?.chrome?.tabs;
    if (browserTabs?.create) {
      browserTabs.create({ url });
      return;
    }
    if (chromeTabs?.create) {
      chromeTabs.create({ url });
      return;
    }
    window?.open?.(url, "_blank");
  };
  return (
    <div className="flex flex-col p-3 mt-2 space-y-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <img src="assets/icons/128.png" alt={name} className="w-16 h-16" />
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground text-center">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-2 text-sm border border-gray-300">
        {/* Version */}
        <div className="flex items-center justify-between p-2 border-b border-r border-gray-300">
          <div className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4" />
            Version
          </div>
          <div className="p-2">{version}</div>
        </div>

        {/* Report a bug */}
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="flex items-center gap-2 font-semibold">
            <Bug className="h-4 w-4" />
            Report a bug
          </div>
          <Button
            size="sm"
            className="underline decoration-wavy hover:decoration-purple-400"
            variant="link"
            onClick={() =>
              open("https://github.com/puemos/hls-downloader/issues")
            }
          >
            Report
          </Button>
        </div>

        {/* Source code */}
        <div className="flex items-center justify-between p-2 border-b border-r border-gray-300">
          <div className="flex items-center gap-2 font-semibold">
            <Code2 className="h-4 w-4" />
            Source code
          </div>
          <Button
            size="sm"
            className="underline decoration-wavy hover:decoration-purple-400"
            variant="link"
            onClick={() => open("https://github.com/puemos/hls-downloader")}
          >
            GitHub
          </Button>
        </div>

        {/* Privacy Policy */}
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" />
            Privacy Policy
          </div>
          <Button
            size="sm"
            className="underline decoration-wavy hover:decoration-purple-400"
            variant="link"
            onClick={() =>
              open(
                "https://github.com/puemos/hls-downloader/blob/master/PRIVACY.md"
              )
            }
          >
            View
          </Button>
        </div>

        {/* License */}
        <div className="flex items-center justify-between p-2 border-r border-gray-300">
          <div className="flex items-center gap-2 font-semibold">
            <Scroll className="h-4 w-4" />
            License
          </div>
          <Button
            size="sm"
            className="underline decoration-wavy hover:decoration-purple-400"
            variant="link"
            onClick={() =>
              open(
                "https://github.com/puemos/hls-downloader/blob/master/LICENSE"
              )
            }
          >
            MIT
          </Button>
        </div>

        {/* Contribute */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Github className="h-4 w-4" />
            Contribute
          </div>
          <Button
            size="sm"
            className="underline decoration-wavy hover:decoration-purple-400"
            variant="link"
            onClick={() => open("https://github.com/puemos/hls-downloader")}
          >
            GitHub
          </Button>
        </div>
      </div>

      <p className="text-sm text-center">
        This browser extension was made with love by Shy Alter. Please support
        the project at{" "}
        <a
          href="https://github.com/puemos/hls-downloader"
          target="_blank"
          className="text-black underline dark:text-white"
        >
          https://github.com/puemos/hls-downloader
        </a>
      </p>
    </div>
  );
};

export default AboutView;
