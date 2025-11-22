import { Badge } from "@hls-downloader/design-system";
import React from "react";

type Props = {
  metadata: {
    type: string;
    width?: number;
    height?: number;
    bitrate?: number;
    fps?: number;
    language?: string;
    name?: string;
    characteristics?: string;
    channels?: string;
    isDefault?: boolean;
    autoSelect?: boolean;
  };
};

export function Metadata({
  metadata: {
    type,
    width,
    height,
    bitrate,
    fps,
    language,
    name,
    channels,
    isDefault,
    autoSelect,
    characteristics,
  },
}: Props) {
  if (type === "stream") {
    return (
      <div className="flex flex-wrap gap-2">
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
        {fps && <Badge variant="secondary">{fps} fps</Badge>}
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="flex flex-wrap gap-2">
        {language && <Badge variant="secondary">{language}</Badge>}
        {name && name !== language && <Badge variant="secondary">{name}</Badge>}
        {channels && (
          <Badge variant="secondary">{channels.toLowerCase()}</Badge>
        )}
        {isDefault && <Badge variant="secondary">default</Badge>}
        {autoSelect && <Badge variant="secondary">auto</Badge>}
        {characteristics && (
          <Badge variant="secondary">{characteristics}</Badge>
        )}
      </div>
    );
  }

  return null;
}
