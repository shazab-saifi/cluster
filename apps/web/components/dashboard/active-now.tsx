import { Hash, User } from "lucide-react";
import type { FriendUser, NetworkListItem } from "./types";
import { getInitials } from "@workspace/ui/lib/utils";

type ActiveNowProps = {
  activeNetwork?: NetworkListItem;
  activeFriend?: FriendUser;
};

export function ActiveNow({ activeNetwork, activeFriend }: ActiveNowProps) {
  const isFriendshipView = Boolean(activeFriend);

  return (
    <aside className="hidden w-90 shrink-0 border-l p-5 xl:block">
      <h2 className="mb-4 text-lg font-bold">Active Now</h2>
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {activeFriend
              ? getInitials(activeFriend.name)
              : activeNetwork
                ? getInitials(activeNetwork.name)
                : "CL"}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">
              {activeFriend?.name ??
                activeNetwork?.name ??
                (isFriendshipView ? "Friend" : "Cluster")}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeFriend
                ? activeFriend.username
                  ? `@${activeFriend.username}`
                  : "Friend"
                : activeNetwork
                  ? `${activeNetwork.role.toLowerCase()} access`
                  : "Waiting for network activity"}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground">
            {isFriendshipView ? (
              <User className="size-4" />
            ) : (
              <Hash className="size-4" />
            )}
            {isFriendshipView ? "direct message" : "general"}
          </div>
          <div className="mt-1">
            {isFriendshipView
              ? "Conversation activity will appear here."
              : "Network activity will appear here."}
          </div>
        </div>
      </div>
    </aside>
  );
}
