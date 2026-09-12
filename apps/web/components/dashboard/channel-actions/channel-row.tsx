"use client";

import { Hash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import type { Channel } from "../types";

export function ChannelRow({ channel }: { channel: Channel }) {
  const pathname = usePathname();
  const href = `/networks/${channel.networkId}/channels/${channel.id}`;
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current="page"
      className={cn(
        "group/channel relative flex items-center rounded-lg px-4 py-1 text-base text-muted-foreground transition focus-within:text-foreground hover:bg-secondary/60 hover:text-foreground",
        active && "bg-secondary text-foreground hover:bg-secondary"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Hash className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm">{channel.name}</span>
      </div>
    </Link>
  );
}
