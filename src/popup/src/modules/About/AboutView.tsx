import { Button } from "@hls-downloader/design-system";
import { Bug, Github, Lock, Scroll, Code2, Info } from "lucide-react";
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
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Info className="h-4 w-4" />
            Version
          </div>
          <div className="font-semibold">{version}</div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Bug className="h-4 w-4" />
            Report a bug
          </div>
          <Button
            size="sm"
            variant="link"
            onClick={() =>
              open("https://github.com/puemos/hls-downloader/issues")
            }
          >
            Report
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Code2 className="h-4 w-4" />
            Source code
          </div>
          <Button
            size="sm"
            variant="link"
            onClick={() => open("https://github.com/puemos/hls-downloader")}
          >
            GitHub
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4" />
            Privacy Policy
          </div>
          <Button
            size="sm"
            variant="link"
            onClick={() =>
              open(
                "https://github.com/puemos/hls-downloader/blob/master/PRIVACY.md",
              )
            }
          >
            View
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Scroll className="h-4 w-4" />
            License
          </div>
          <Button
            size="sm"
            variant="link"
            onClick={() =>
              open(
                "https://github.com/puemos/hls-downloader/blob/master/LICENSE",
              )
            }
          >
            MIT
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-md border p-2">
          <div className="flex items-center gap-2 font-semibold">
            <Github className="h-4 w-4" />
            Contribute
          </div>
          <Button
            size="sm"
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
