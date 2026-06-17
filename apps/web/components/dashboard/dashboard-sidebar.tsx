import {
  AlertCircle,
  Inbox,
  LoaderCircle,
  UserPlus,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { ChannelRow } from "./channel-actions/channel-row";
import type { Channel, DashboardUser, NetworkListItem } from "./types";
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
  onCreateChannel: () => void;
  onCreateNetwork: () => void;
};

export function DashboardSidebar({
  activeNetwork,
  channels,
  isChannelsLoading,
  hasChannelsError,
  user,
  sessionUser,
  onAddMember,
  onCreateChannel,
}: DashboardSidebarProps) {
  const canAddMember =
    activeNetwork?.role === "OWNER" || activeNetwork?.role === "ADMIN";

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r bg-background md:flex">
      <div className="border-b p-3">
        <Input
          aria-label="Find or start a conversation"
          placeholder="Find or start a conversation"
          className="h-9 bg-background"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 justify-start gap-3 px-3 text-base"
        >
          <Users className="size-5" />
          Friends
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start gap-3 px-3 text-base text-muted-foreground"
        >
          <Inbox className="size-5" />
          Inbox
        </Button>
        {canAddMember && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 justify-start gap-3 px-3 text-base text-muted-foreground"
            onClick={onAddMember}
          >
            <UserPlus className="size-5" />
            Add member
          </Button>
        )}

        <div className="mt-4 flex items-center justify-between px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span className="min-w-0 truncate">
            {activeNetwork ? activeNetwork.name : "Channels"}
          </span>
          <button
            type="button"
            aria-label="Create channel"
            title="Create channel"
            className="rounded p-0.5 transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={!activeNetwork}
            onClick={onCreateChannel}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {isChannelsLoading && (
            <div className="flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading channels
            </div>
          )}
          {hasChannelsError && (
            <div className="flex h-10 items-center gap-3 rounded-lg px-2 text-sm text-muted-foreground">
              <AlertCircle className="size-4" />
              Channels unavailable
            </div>
          )}
          {!isChannelsLoading &&
            !hasChannelsError &&
            channels.map((channel) => (
              <ChannelRow key={channel.id} channel={channel} />
            ))}
          {!isChannelsLoading && !hasChannelsError && channels.length === 0 && (
            <div className="rounded-lg px-2 py-3 text-sm text-muted-foreground">
              No channels yet
            </div>
          )}
        </div>
      </nav>
      <UserFooter user={user} sessionUser={sessionUser} />
    </aside>
  );
}
