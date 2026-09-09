"use client";

import * as React from "react";
import { Hash, Pencil, Trash2 } from "lucide-react";
import type { Channel } from "../types";
import {
  DeleteChannelDialog,
  EditChannelDialog,
} from "./channel-action-dialogs";

export function ChannelManageRow({ channel }: { channel: Channel }) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  return (
    <>
      <div className="flex min-h-14 items-center gap-3 bg-transparent px-3 py-2 transition hover:bg-muted/50">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Hash className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {channel.name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            aria-label={`Edit ${channel.name} channel`}
            onClick={() => setIsEditOpen(true)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all outline-none select-none hover:bg-tertiary hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${channel.name} channel`}
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-all outline-none select-none hover:bg-destructive/15 hover:text-destructive focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
          >
            <Trash2 className="size-4" />
          </button>
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
