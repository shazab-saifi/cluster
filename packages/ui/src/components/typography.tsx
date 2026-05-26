import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";

const TypographyH4 = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h4">
>(({ className, ...props }, ref) => {
  return (
    <h4
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
});

TypographyH4.displayName = "TypographyH4";

export { TypographyH4 };
