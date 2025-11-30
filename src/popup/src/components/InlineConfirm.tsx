import React, { useState } from "react";
import { Button } from "@hls-downloader/design-system";

interface InlineConfirmProps {
  label: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
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
    setConfirming(false);
  }

  function handleCancel() {
    setConfirming(false);
    onCancel?.();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleConfirm}
          disabled={busy}
        >
          {confirmLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          {cancelLabel}
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={variant}
      onClick={() => setConfirming(true)}
      disabled={disabled || busy}
    >
      {label}
    </Button>
  );
};

export default InlineConfirm;
