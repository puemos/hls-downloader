import { cn } from "@hls-downloader/design-system";
import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

const DetailScreen = ({ children, className }: Props) => (
  <div
    data-detail-screen
    className={cn(
      "h-full min-h-0 animate-in fade-in slide-in-from-right-2 duration-150",
      className,
    )}
  >
    {children}
  </div>
);

export default DetailScreen;
