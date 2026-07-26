import React, { useState } from "react";
import { Button, cn } from "@hls-downloader/design-system";

interface InlineConfirmProps {
  label: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?:
    "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const InlineConfirm = ({
  label,
  confirmLabel = "Yes",
  cancelLabel = "No",
  disabled,
  busy,
  onConfirm,
  onCancel,
  variant = "outline",
}: InlineConfirmProps) => {
  const [confirming, setConfirming] = useState(false);

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    setConfirming(false);
    onCancel?.();
  }

  return (
    <div className="inline-grid">
      <div
        aria-hidden={!confirming}
        data-active={confirming}
        className={cn(
          "motion-state-layer col-start-1 row-start-1 flex items-center gap-2 justify-self-end",
          confirming
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-[0.97] opacity-0",
        )}
      >
        <Button
          size="sm"
          variant="destructive"
          onClick={handleConfirm}
          disabled={!confirming || busy}
          tabIndex={confirming ? undefined : -1}
        >
          {confirmLabel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={!confirming}
          tabIndex={confirming ? undefined : -1}
        >
          {cancelLabel}
        </Button>
      </div>
      <div
        aria-hidden={confirming}
        data-active={!confirming}
        className={cn(
          "motion-state-layer col-start-1 row-start-1 justify-self-end",
          confirming
            ? "pointer-events-none scale-[0.97] opacity-0"
            : "pointer-events-auto scale-100 opacity-100",
        )}
      >
        <Button
          size="sm"
          variant={variant}
          onClick={() => setConfirming(true)}
          disabled={confirming || disabled || busy}
          tabIndex={confirming ? -1 : undefined}
        >
          {label}
        </Button>
      </div>
    </div>
  );
};

export default InlineConfirm;
