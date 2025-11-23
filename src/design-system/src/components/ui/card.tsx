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
        "flex flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-md",
        interactive && "cursor-pointer hover:bg-muted transition-colors",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
