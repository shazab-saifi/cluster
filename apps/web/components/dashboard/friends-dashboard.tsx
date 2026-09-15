"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getFriends, getMe, getPendingFriendRequests } from "@/lib/api";
import { DashboardHeader } from "./dashboard-header";
import { EmptyFriends, FriendsSidebar } from "./friends-sidebar";
import { SearchUserDialog } from "./friends-tabs/search-user";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import NetworkStrip from "./network-strip";
import { getNetworkList } from "@/lib/utils";
import { getInitials } from "@workspace/ui/lib/utils";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { DashboardUser, Friendship } from "./types";

type FriendsTab = "Online" | "All" | "Pending";

export function FriendsDashboard() {
  const router = useRouter();
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FriendsTab>("Online");
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
  const { data: pendingRequests = [], isLoading: isPendingLoading } = useQuery({
    queryKey: ["pending-friend-requests"],
    queryFn: getPendingFriendRequests,
    enabled: activeTab === "Pending",
  });

  const user = profile?.userData;
  const networks = getNetworkList(user);
  const hasFriends = friends.length > 0;
  const hasPending = pendingRequests.length > 0;

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      console.error(error);
      return;
    }

    router.replace("/signin");
    router.refresh();
  };

  return (
    <main className="flex h-svh overflow-hidden bg-background text-foreground">
      <NetworkStrip networks={networks} isLoading={isProfileLoading} />
      <FriendsSidebar
        friends={friends}
        isLoading={isLoading}
        user={user}
        onAddFriendClick={() => setIsSearchUserOpen(true)}
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          onSignOut={handleSignOut}
          activeFriendsTab={activeTab}
          onFriendsTabChange={setActiveTab}
        />
        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 items-center justify-center p-6">
            {activeTab === "Pending" ? (
              <PendingRequests
                pendingRequests={pendingRequests}
                isLoading={isPendingLoading}
                user={user}
              />
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground">Loading friends</p>
            ) : hasFriends ? (
              <p className="text-center text-sm text-muted-foreground">
                Select a friend to start a conversation.
              </p>
            ) : (
              <EmptyFriends />
            )}
          </section>
          <aside className="hidden w-90 shrink-0 items-center justify-center border-l p-6 xl:flex">
            {hasFriends ? (
              <p className="text-center text-sm text-muted-foreground">
                Friend activity will appear here.
              </p>
            ) : (
              <EmptyFriends showAction={false} />
            )}
          </aside>
        </div>
      </section>
      <SearchUserDialog
        open={isSearchUserOpen}
        onOpenChange={setIsSearchUserOpen}
      />
      <CreateNetworkDialog
        open={isCreateNetworkOpen}
        onOpenChange={setIsCreateNetworkOpen}
      />
    </main>
  );
}

function PendingRequests({
  pendingRequests,
  isLoading,
  user,
}: {
  pendingRequests: Friendship[];
  isLoading: boolean;
  user?: DashboardUser;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
        Loading pending requests
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        You don&apos;t have any pending request
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col divide-y rounded-lg border">
      {pendingRequests.map((friendship) => {
        const friend =
          friendship.senderId === user?.id
            ? friendship.receiver
            : friendship.sender;
        const name = friend?.name ?? friend?.username ?? "Friend";

        return (
          <div
            key={friendship.id}
            className="flex h-16 items-center gap-3 px-4"
          >
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
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
            <span className="min-w-0 truncate font-medium">{name}</span>
            <span className="ml-auto shrink-0 text-sm text-muted-foreground">
              Pending
            </span>
          </div>
        );
      })}
    </div>
  );
}
