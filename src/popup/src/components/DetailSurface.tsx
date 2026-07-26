import { Card, cn } from "@hls-downloader/design-system";
import React, { ReactNode } from "react";

interface DetailHeaderProps {
  title: ReactNode;
  supporting?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export const DetailHeader = ({
  title,
  supporting,
  aside,
  className,
}: DetailHeaderProps) => (
  <header className={cn("px-1 pb-0.5", className)}>
    <div className="flex min-w-0 items-start justify-between gap-4">
      <h2 className="min-w-0 flex-1 truncate text-[16px] font-extrabold leading-tight tracking-[-0.025em]">
        {title}
      </h2>
      {aside && <div className="shrink-0 text-right">{aside}</div>}
    </div>
    {supporting && (
      <div className="mt-1 min-w-0 text-[10px] leading-relaxed text-muted-foreground">
        {supporting}
      </div>
    )}
  </header>
);

export const DetailPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <Card
    className={cn(
      "gap-0 overflow-hidden rounded-[11px] p-0 shadow-none",
      className,
    )}
  >
    {children}
  </Card>
);

interface DetailRowProps {
  label: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const DetailRow = ({
  label,
  icon: Icon,
  children,
  action,
  className,
}: DetailRowProps) => (
  <div
    className={cn(
      "grid min-h-[52px] grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-2 border-b border-border/70 px-3 py-2 last:border-b-0",
      className,
    )}
  >
    <div className="flex min-w-0 items-center gap-2 text-[11px] font-bold">
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
      <span className="truncate">{label}</span>
    </div>
    <div className="min-w-0">{children}</div>
    {action}
  </div>
);
