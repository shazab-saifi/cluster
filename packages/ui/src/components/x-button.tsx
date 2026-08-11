import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@workspace/ui/lib/utils";

const xButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition outline-none hover:bg-secondary hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      size: {
        md: "size-7 [&_svg]:size-4",
        lg: "size-9 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

type XButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof xButtonVariants>;

function XButton({
  className,
  size = "md",
  type = "button",
  "aria-label": ariaLabel = "Close",
  ...props
}: XButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={cn(xButtonVariants({ size, className }))}
      {...props}
    >
      <X />
    </button>
  );
}

export { XButton, xButtonVariants };
