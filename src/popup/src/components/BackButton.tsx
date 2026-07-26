import { Button, cn } from "@hls-downloader/design-system";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
}

const BackButton = ({ label, onClick, className }: Props) => (
  <Button
    type="button"
    size="sm"
    variant="ghost"
    className={cn(
      "-ml-2 h-8 self-start gap-1.5 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground",
      className,
    )}
    onClick={onClick}
    aria-label={label}
  >
    <ArrowLeft className="h-3.5 w-3.5" />
    {label}
  </Button>
);

export default BackButton;
