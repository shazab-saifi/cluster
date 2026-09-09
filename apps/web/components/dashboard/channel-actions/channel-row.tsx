"use client";

import { Hash } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { Channel } from "../types";

export function ChannelRow({
  channel,
  setIsChatOpen,
  active = false,
}: {
  channel: Channel;
  setIsChatOpen: (value: string) => void;
  active?: boolean;
}) {
  return (
    <span
      onClick={() => setIsChatOpen(channel.id)}
      className={cn(
        "group/channel relative flex cursor-pointer items-center rounded-lg px-4 py-1 text-base text-muted-foreground transition focus-within:text-foreground hover:bg-secondary/60 hover:text-foreground",
        active && "hover:bg-secondar bg-secondary text-foreground"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Hash className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm">{channel.name}</span>
      </div>
    </span>
  );
}
