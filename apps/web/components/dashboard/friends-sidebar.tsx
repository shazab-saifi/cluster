"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UserPlus, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { getFriends } from "@/lib/api";
import type { DashboardUser, Friendship } from "./types";
import { UserFooter } from "./user-footer";

type FriendsSidebarProps = {
  user?: DashboardUser;
  onAddFriendClick?: () => void;
};

function getFriend(friendship: Friendship, user?: DashboardUser) {
  return friendship.senderId === user?.id
    ? friendship.receiver
    : friendship.sender;
}

export function FriendsSidebar({
  user,
  onAddFriendClick,
}: FriendsSidebarProps) {
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    meta: { requiresAuth: true },
  });
  const [friendQuery, setFriendQuery] = React.useState("");
  const filteredFriends = friends.filter((friendship) => {
    const friend = getFriend(friendship, user);
    const name = friend?.name ?? friend?.username ?? "Friend";

    return name.toLowerCase().includes(friendQuery.toLowerCase());
  });
  const hasFriends = filteredFriends.length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-background md:flex">
      <div className="space-y-2 border-b px-8 py-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 text-left text-base font-semibold tracking-tight"
        >
          <Users className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 truncate">Friends</span>
        </button>
        <p className="text-xs text-muted-foreground">
          {friends.length.toLocaleString()} Direct Messages
        </p>
      </div>
      <div className="space-y-2 border-b p-4">
        <button
          type="button"
          onClick={onAddFriendClick}
          className="flex h-auto w-full cursor-pointer items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <UserPlus className="size-5" />
          Add Friend
        </button>
        <div className="flex items-center gap-2 rounded-lg border-2 bg-transparent px-4 py-1 shadow-none">
          <Search className="pointer-events-none size-5 text-muted-foreground" />
          <Input
            aria-label="Search friends"
            placeholder="Search Friend"
            value={friendQuery}
            onChange={(event) => setFriendQuery(event.target.value)}
            className="placeholder:text-muted-foNo outgoing friend requestsreground border-none bg-transparent py-0 text-sm placeholder:text-sm dark:bg-transparent"
            variant="ghost"
          />
        </div>
      </div>
      <nav className="custom-scrollbar flex flex-1 flex-col overflow-y-auto scroll-smooth p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="pl-4 text-xs font-medium text-muted-foreground">
            Direct Messages
          </span>
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg px-4 py-2"
              >
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
        ) : hasFriends ? (
          <div className="flex flex-col gap-1">
            {filteredFriends.map((friendship) => {
              const friend = getFriend(friendship, user);
              const name = friend?.name ?? friend?.username ?? "Friend";

              return (
                <div
                  key={friendship.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Avatar className="shrink-0">
                    {friend?.image ? (
                      <AvatarImage src={friend.image} alt="" />
                    ) : null}
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 truncate text-sm font-medium">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyFriends compact showAction={false} />
        )}
      </nav>
      <UserFooter user={user} />
    </aside>
  );
}

export function EmptyFriends({
  compact = false,
  showAction = true,
}: {
  compact?: boolean;
  showAction?: boolean;
}) {
  return (
    <div
      className={cn(
        compact
          ? "flex flex-col items-center gap-3 px-2 py-4 text-center text-sm text-muted-foreground"
          : "flex max-w-sm flex-col items-center gap-3 text-center text-sm text-muted-foreground"
      )}
    >
      <p>No friends yet, add friends</p>
      {showAction && (
        <Button type="button" variant="secondary" size="sm">
          Add friends
        </Button>
      )}
    </div>
  );
}
