"use client";

import { useState } from "react";
import {
  CopyIcon,
  DotsThreeIcon,
  PencilSimpleIcon,
  SmileyIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

type MessageManageProps = {
  isOpen: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
};

export const MessageManage = ({
  isOpen,
  message,
  onOpenChange,
}: MessageManageProps) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isTooltipSuppressed, setIsTooltipSuppressed] = useState(false);

  const suppressTooltip = () => {
    setIsTooltipOpen(false);
    setIsTooltipSuppressed(true);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    onOpenChange(open);
    suppressTooltip();
  };

  const handleCopy = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    void navigator.clipboard.writeText(message);
    toast.success("Copied to Clipbaord!");
  };

  const handlePointerEnter = () => {
    if (!isOpen) setIsTooltipSuppressed(false);
  };

  const handlePointerLeave = () => {
    setIsTooltipOpen(false);
    if (!isOpen) setIsTooltipSuppressed(false);
  };

  const actionClassName = cn(
    "inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 opacity-0 transition-all outline-none group-focus-within:opacity-100 group-hover:opacity-100 group-hover:delay-200 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:pointer-events-none",
    isOpen && "text-foreground opacity-100"
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 right-2 z-20 -translate-y-full pb-2 group-focus-within:pointer-events-auto group-hover:pointer-events-auto",
        isOpen && "pointer-events-auto"
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-md px-2 py-1 group-focus-within:bg-accent group-hover:bg-accent group-hover:delay-200 after:absolute after:inset-x-0 after:top-full after:h-2",
          isOpen && "bg-accent"
        )}
      >
        <button
          type="button"
          aria-label="Add reaction"
          className={actionClassName}
        >
          <SmileyIcon className="size-6" />
        </button>

        <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
          <TooltipProvider>
            <Tooltip
              open={!isOpen && !isTooltipSuppressed && isTooltipOpen}
              onOpenChange={setIsTooltipOpen}
            >
              <TooltipTrigger asChild>
                <DropdownMenuTrigger
                  type="button"
                  aria-label="Open message actions"
                  className={cn(
                    actionClassName,
                    "data-[state=open]:text-foreground data-[state=open]:opacity-100"
                  )}
                  onClick={suppressTooltip}
                >
                  <DotsThreeIcon weight="bold" className="size-6" />
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                More
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent
            align="end"
            aria-label="Message actions"
            className="w-36"
          >
            <DropdownMenuItem>
              <PencilSimpleIcon />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleCopy}>
              <CopyIcon />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive">
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
