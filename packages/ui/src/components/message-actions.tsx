"use client";

import { useRef, useState } from "react";
import { Copy, Ellipsis, Pencil, Smile, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

type MessageActionsProps = {
  messageId: string;
  isOpen: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
  handleMsgDelete: (messageId: string) => void;
  setIsEditing: ({
    messageId,
    message,
  }: {
    messageId: string;
    message: string;
  }) => void;
};

export const MessageActions = ({
  messageId,
  isOpen,
  message,
  onOpenChange,
  handleMsgDelete,
  setIsEditing,
}: MessageActionsProps) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isTooltipSuppressed, setIsTooltipSuppressed] = useState(false);
  const skipTriggerFocusRef = useRef(false);

  const suppressTooltip = () => {
    setIsTooltipOpen(false);
    setIsTooltipSuppressed(true);
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (open) skipTriggerFocusRef.current = false;
    onOpenChange(open);
    suppressTooltip();
  };

  const handleItemPointerDown = () => {
    skipTriggerFocusRef.current = true;
  };

  const handleCloseAutoFocus = (event: Event) => {
    if (!skipTriggerFocusRef.current) return;

    event.preventDefault();
    skipTriggerFocusRef.current = false;
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
    "inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 opacity-0 transition-all outline-none group-hover:opacity-100 group-hover:delay-200 hover:text-foreground [&_svg]:pointer-events-none",
    isOpen && "text-foreground opacity-100"
  );

  return (
    <div
      className={cn(
        "pointer-events-none absolute top-0 right-2 z-20 -translate-y-full pb-2 group-hover:pointer-events-auto",
        isOpen && "pointer-events-auto"
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-md px-2 py-1 group-hover:bg-tertiary group-hover:delay-200 after:absolute after:inset-x-0 after:top-full after:h-2",
          isOpen && "bg-tertiary"
        )}
      >
        <button
          type="button"
          aria-label="Add reaction"
          className={actionClassName}
        >
          <Smile
            size={28}
            className="size-6 fill-muted-foreground stroke-secondary dark:stroke-tertiary dark:hover:fill-foreground"
          />
        </button>

        <DropdownMenu open={isOpen} onOpenChange={handleDropdownOpenChange}>
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
                <Ellipsis className="size-6" />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>
              More
            </TooltipContent>
          </Tooltip>

          <DropdownMenuContent
            align="end"
            aria-label="Message actions"
            className="w-36"
            onCloseAutoFocus={handleCloseAutoFocus}
          >
            <DropdownMenuItem
              onSelect={() => {
                handleItemPointerDown();
                requestAnimationFrame(() => {
                  setIsEditing({ messageId, message });
                });
              }}
            >
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onPointerDown={handleItemPointerDown}
              onSelect={handleCopy}
            >
              <Copy />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onPointerDown={() => {
                handleItemPointerDown();
                handleMsgDelete(messageId);
              }}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
