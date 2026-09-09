"use client";

import type { Channel } from "../types";
import { ChannelManageRow } from "../channel-actions/channel-manage-row";

export function ChannelsContent({ channels }: { channels: Channel[] }) {
  return (
    <div className="mt-6">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Channels</h3>
      {channels.length === 0 ? (
        <div className="flex min-h-20 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
          No channels yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {channels.map((channel) => (
            <ChannelManageRow key={channel.id} channel={channel} />
          ))}
        </div>
      )}
    </div>
  );
}
