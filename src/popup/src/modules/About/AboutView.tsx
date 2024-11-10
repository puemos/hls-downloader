import { Button } from "@hls-downloader/design-system";
import React from "react";

interface Props {
  version: string;
}

const AboutView = ({ version }: Props) => {
  return (
    <div className="flex flex-col p-1 mt-4 space-y-3">
      <div className="flex items-center justify-between h-16 p-3 border rounded-sm shrink-0">
        <div>
          <p className="text-sm font-semibold">
            <span aria-label="plant" role="img" className="mr-2">
              🌱
            </span>
            Version
          </p>
        </div>
        <div className="text-sm font-semibold">{version}</div>
      </div>
      <div className="flex items-center justify-between h-16 p-3 border rounded-sm shrink-0">
        <div>
          <p className="text-sm font-semibold">
            <span aria-label="plant" role="img" className="mr-2">
              🐞
            </span>
            Report a bug
          </p>
        </div>
        <Button size="sm" variant="secondary">
          Report
        </Button>
      </div>

      <p className="mt-10 text-sm">
        This browser extension template was made with love by Shy Alter. Please
        support the project at{" "}
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
