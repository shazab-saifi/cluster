"use client";

import * as React from "react";
import { Hash, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { Channel } from "../types";
import {
  DeleteChannelDialog,
  EditChannelDialog,
} from "./channel-action-dialogs";

type ChannelRowProps = {
  channel: Channel;
};

export function ChannelRow({ channel }: ChannelRowProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="group/channel relative flex h-10 items-center rounded-lg text-sm text-muted-foreground transition focus-within:bg-muted focus-within:text-foreground hover:bg-neutral-950 hover:text-foreground">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 px-2 text-left"
        >
          <Hash className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{channel.name}</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Open ${channel.name} channel menu`}
            className="mr-1 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-[min(var(--radius-md),10px)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap opacity-0 transition-all outline-none select-none group-focus-within/channel:opacity-100 group-hover/channel:opacity-100 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-muted data-[state=open]:text-foreground data-[state=open]:opacity-100 [&_svg]:pointer-events-none [&_svg]:shrink-0"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            aria-label={`${channel.name} channel actions`}
            className="w-40"
          >
            <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setIsDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
