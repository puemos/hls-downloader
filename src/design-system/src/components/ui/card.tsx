import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 rounded-[11px] border border-border bg-card p-3 text-card-foreground",
        interactive &&
          "cursor-pointer transition-[background-color,border-color,transform] duration-150 ease-snappy hover:border-foreground/20 hover:bg-muted/50 active:scale-[0.99]",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };
