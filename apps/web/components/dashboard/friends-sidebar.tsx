import { LoaderCircle, Users } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { getInitials } from "@workspace/ui/lib/utils";
import type { DashboardUser, Friendship } from "./types";
import { UserFooter } from "./user-footer";

type FriendsSidebarProps = {
  friends: Friendship[];
  isLoading: boolean;
  user?: DashboardUser;
  sessionUser?: {
    name?: string | null;
    image?: string | null;
  };
};

function getFriend(friendship: Friendship, user?: DashboardUser) {
  return friendship.senderId === user?.id
    ? friendship.receiver
    : friendship.sender;
}

export function FriendsSidebar({
  friends,
  isLoading,
  user,
  sessionUser,
}: FriendsSidebarProps) {
  const hasFriends = friends.length > 0;

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
        <Users className="size-5 text-muted-foreground" />
        Friends
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading friends
          </div>
        ) : hasFriends ? (
          <div className="flex flex-col gap-1">
            {friends.map((friendship) => {
              const friend = getFriend(friendship, user);
              const name = friend?.name ?? friend?.username ?? "Friend";

              return (
                <div
                  key={friendship.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
                    {friend?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={friend.image}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
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
      </div>
      <UserFooter user={user} sessionUser={sessionUser} />
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
      className={
        compact
          ? "flex flex-col items-center gap-3 px-2 py-4 text-center text-sm text-muted-foreground"
          : "flex max-w-sm flex-col items-center gap-3 text-center text-sm text-muted-foreground"
      }
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
