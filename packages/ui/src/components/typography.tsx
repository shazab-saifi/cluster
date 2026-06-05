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

const TypographyH2 = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentPropsWithoutRef<"h2">
>(({ className, children, ...props }, ref) => {
  return (
    <h2
      ref={ref}
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
});

TypographyH4.displayName = "TypographyH4";
TypographyH2.displayName = "TypographyH2";

export { TypographyH4, TypographyH2 };
