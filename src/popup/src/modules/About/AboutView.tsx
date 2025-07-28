import { Button } from "@hls-downloader/design-system";
import React from "react";

interface Props {
  version: string;
  name: string;
  description: string;
}

const AboutView = ({ version, name, description }: Props) => {
  const open = (url: string) => {
    window.open(url, "_blank");
  };
  return (
    <div className="flex flex-col p-1 mt-4 space-y-2">
      <div className="flex flex-col items-center justify-center space-y-1">
        <img src="assets/icons/128.png" alt={name} className="w-16 h-16" />
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground text-center">
          {description}
        </p>
      </div>
      <div className="flex items-center justify-between p-2 border rounded-sm">
        <p className="text-sm font-semibold flex items-center">
          <span aria-label="plant" role="img" className="mr-2">
            🌱
          </span>
          Version
        </p>
        <div className="text-sm font-semibold">{version}</div>
      </div>
      <div className="flex items-center justify-between p-2 border rounded-sm">
        <p className="text-sm font-semibold flex items-center">
          <span aria-label="bug" role="img" className="mr-2">
            🐞
          </span>
          Report a bug
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            open("https://github.com/puemos/hls-downloader/issues")
          }
        >
          Report
        </Button>
      </div>
      <div className="flex items-center justify-between p-2 border rounded-sm">
        <p className="text-sm font-semibold flex items-center">
          <span aria-label="code" role="img" className="mr-2">
            💻
          </span>
          Source code
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => open("https://github.com/puemos/hls-downloader")}
        >
          GitHub
        </Button>
      </div>
      <div className="flex items-center justify-between p-2 border rounded-sm">
        <p className="text-sm font-semibold flex items-center">
          <span aria-label="lock" role="img" className="mr-2">
            🔒
          </span>
          Privacy Policy
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            open(
              "https://github.com/puemos/hls-downloader/blob/master/PRIVACY.md"
            )
          }
        >
          View
        </Button>
      </div>
      <div className="flex items-center justify-between p-2 border rounded-sm">
        <p className="text-sm font-semibold flex items-center">
          <span aria-label="scroll" role="img" className="mr-2">
            📜
          </span>
          License
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            open("https://github.com/puemos/hls-downloader/blob/master/LICENSE")
          }
        >
          MIT
        </Button>
      </div>

      <p className="mt-6 text-sm text-center">
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
