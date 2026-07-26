import { cn } from "@hls-downloader/design-system";
import React, { ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  closeLabel: string;
  children: ReactNode;
  className?: string;
}

const BottomSheet = ({
  open,
  onClose,
  labelledBy,
  closeLabel,
  children,
  className,
}: Props) => {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }

    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    exitTimer.current = setTimeout(() => {
      setMounted(false);
      exitTimer.current = null;
    }, 180);

    return () => {
      if (exitTimer.current) {
        clearTimeout(exitTimer.current);
        exitTimer.current = null;
      }
    };
  }, [open]);

  if (!mounted && !open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[60px] top-0 z-40 overflow-hidden">
      <button
        type="button"
        className={cn(
          "motion-sheet-scrim pointer-events-auto absolute inset-0 cursor-default bg-black/10 backdrop-blur-[1px] dark:bg-black/45",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-label={closeLabel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-hidden={!visible}
        className={cn(
          "motion-bottom-sheet pointer-events-auto absolute inset-x-0 bottom-0 z-10 rounded-t-[16px] border border-b-0 bg-card p-4 shadow-[0_-12px_32px_rgba(25,24,21,0.10)]",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-[0.98]",
          className,
        )}
      >
        {children}
      </section>
    </div>
  );
};

export default BottomSheet;
