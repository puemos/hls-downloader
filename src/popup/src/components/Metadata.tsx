import { Badge } from "@hls-downloader/design-system";
import React from "react";

type Props = {
  metadata: {
    type: string;
    width?: number;
    height?: number;
    bitrate?: number;
    fps?: number;
  };
};

export function Metadata({
  metadata: { type, width, height, bitrate, fps },
}: Props) {
  if (type === "stream") {
    return (
      <div className="flex space-x-2">
        {width && (
          <Badge variant="secondary">
            {width}×{height}
          </Badge>
        )}

        {bitrate && (
          <Badge variant="secondary">
            {(bitrate / 1024 / 1024).toFixed(1)} mbps
          </Badge>
        )}
        {fps && <Badge variant="secondary">{fps}</Badge>}
      </div>
    );
  }

  return null;
}
