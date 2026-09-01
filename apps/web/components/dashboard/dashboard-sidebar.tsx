import * as React from "react";
import {
  CircleAlert,
  LoaderCircle,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { ChannelRow } from "./channel-actions/channel-row";
import type { Channel, DashboardUser, NetworkListItem } from "./types";
import { ActiveNetworkMenu } from "./active-network-menu";
import { UserFooter } from "./user-footer";

type DashboardSidebarProps = {
  activeNetwork?: NetworkListItem;
  channels: Channel[];
  isChannelsLoading: boolean;
  hasChannelsError: boolean;
  user?: DashboardUser;
  sessionUser?: {
    name?: string | null;
    image?: string | null;
  };
  onAddMember: () => void;
  onLeaveNetwork: () => void;
  isLeavingNetwork: boolean;
  activeChannelId?: string;
  onCreateChannel: () => void;
  onCreateNetwork: () => void;
  setIsChatOpen: (val: string) => void;
};

export function DashboardSidebar({
  activeNetwork,
  channels,
  isChannelsLoading,
  hasChannelsError,
  user,
  sessionUser,
  onAddMember,
  onLeaveNetwork,
  isLeavingNetwork,
  onCreateChannel,
  setIsChatOpen,
  activeChannelId,
}: DashboardSidebarProps) {
  const [channelQuery, setChannelQuery] = React.useState("");
  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(channelQuery.toLowerCase())
  );

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background md:flex">
      <div className="space-y-2 border-b px-8 py-4">
        <ActiveNetworkMenu
          activeNetwork={activeNetwork}
          isLeaving={isLeavingNetwork}
          onLeave={onLeaveNetwork}
        />
        <p className="text-xs text-muted-foreground">
          {activeNetwork?.memberCount !== undefined &&
            activeNetwork.memberCount.toLocaleString()}{" "}
          Members
        </p>
      </div>
      <div className="space-y-2 border-b p-4">
        <button
          type="button"
          className="flex h-auto w-full cursor-pointer items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={onAddMember}
          disabled={!activeNetwork || isLeavingNetwork}
        >
          <UserPlus className="size-5" />
          Invite to Network
        </button>
        <div className="flex items-center gap-2 rounded-lg border-2 bg-transparent px-4 py-1 shadow-none">
          <Search className="pointer-events-none size-5 text-muted-foreground" />
          <Input
            aria-label="Search channels"
            placeholder="Search Channel"
            value={channelQuery}
            onChange={(event) => setChannelQuery(event.target.value)}
            className="border-none bg-transparent py-0 text-sm placeholder:text-sm placeholder:text-muted-foreground dark:bg-transparent"
          />
        </div>
      </div>
      <nav className="custom-scrollbar flex flex-1 flex-col overflow-y-auto scroll-smooth p-4">
        <div className="mb-4 flex items-center justify-between pl-4">
          <span className="text-xs font-medium text-muted-foreground">
            Channels
          </span>
          <button
            type="button"
            aria-label="Create channel"
            title="Create channel"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={!activeNetwork || isLeavingNetwork}
            onClick={onCreateChannel}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {isChannelsLoading && (
            <div className="mx-auto flex h-10 flex-col items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-5 shrink-0 animate-spin" />
              Loading channels...
            </div>
          )}
          {hasChannelsError && (
            <div className="mx-auto flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground">
              <CircleAlert className="size-6" />
              Channels unavailable
            </div>
          )}
          {!isChannelsLoading &&
            !hasChannelsError &&
            filteredChannels.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                setIsChatOpen={setIsChatOpen}
                active={channel.id === activeChannelId}
              />
            ))}
          {!isChannelsLoading &&
            !hasChannelsError &&
            filteredChannels.length === 0 && (
              <div className="rounded-lg px-2 py-3 text-base text-muted-foreground">
                No matching channels
              </div>
            )}
        </div>
      </nav>
      <UserFooter user={user} sessionUser={sessionUser} />
    </aside>
  );
}
