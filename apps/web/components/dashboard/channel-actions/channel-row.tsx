"use client";

import * as React from "react";
import { Hash, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Channel } from "../types";
import {
  DeleteChannelDialog,
  EditChannelDialog,
} from "./channel-action-dialogs";

type ChannelRowProps = {
  channel: Channel;
};

export function ChannelRow({ channel }: ChannelRowProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMenuOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <div className="group/channel relative flex h-10 items-center rounded-lg text-sm text-muted-foreground transition focus-within:bg-muted focus-within:text-foreground hover:bg-muted hover:text-foreground">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 px-2 text-left"
        >
          <Hash className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{channel.name}</span>
        </button>
        <div ref={menuRef} className="relative shrink-0 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={`Open ${channel.name} channel menu`}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            className="opacity-0 transition group-focus-within/channel:opacity-100 group-hover/channel:opacity-100 data-[state=open]:opacity-100"
            data-state={isMenuOpen ? "open" : "closed"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <MoreHorizontal className="size-4" />
          </Button>

          {isMenuOpen && (
            <div
              role="menu"
              aria-label={`${channel.name} channel actions`}
              className="absolute top-8 right-1 z-20 w-40 rounded-lg border bg-card p-1 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground focus:outline-none"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsEditOpen(true);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-destructive transition hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <EditChannelDialog
        channel={channel}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
      <DeleteChannelDialog
        channel={channel}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
