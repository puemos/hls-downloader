import { Button, Input, cn } from "@hls-downloader/design-system";
import { Check, Pencil, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  filename: string;
  canRename: boolean;
  onRename: (filename: string) => void;
  className?: string;
}

const CONTAINER_EXTENSION = /\.(mp4|mkv)$/i;

export const JobFilename = ({
  filename,
  canRename,
  onRename,
  className,
}: Props) => {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = draft !== null;

  useEffect(() => {
    if (isEditing) inputRef.current?.select();
  }, [isEditing]);

  if (!isEditing) {
    return (
      <span className="inline-flex min-w-0 max-w-full items-center gap-1">
        <span className={cn("min-w-0 truncate", className)} title={filename}>
          {filename}
        </span>
        {canRename && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            aria-label="Rename file"
            title="Rename file"
            onClick={() => setDraft(filename.replace(CONTAINER_EXTENSION, ""))}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </span>
    );
  }

  const save = () => {
    if (draft.trim()) onRename(draft);
    setDraft(null);
  };

  return (
    <span className="flex w-full min-w-0 items-center gap-1">
      <Input
        ref={inputRef}
        value={draft}
        aria-label="File name"
        className="h-7 px-2 text-[12px] font-semibold"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            save();
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setDraft(null);
          }
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label="Save file name"
        onClick={save}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label="Cancel renaming"
        onClick={() => setDraft(null)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </span>
  );
};
