"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getFriends, getMe } from "./api";
import { DashboardHeader } from "./dashboard-header";
import { EmptyFriends, FriendsSidebar } from "./friends-sidebar";
import { SearchUserDialog } from "./friends-tabs/search-user";
import NetworkStrip from "./network-strip";
import { getNetworkList } from "./utils";

export function FriendsDashboard() {
  const router = useRouter();
  const [isSearchUserOpen, setIsSearchUserOpen] = React.useState(false);
  const { data: session } = authClient.useSession();
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });

  const user = profile?.userData;
  const networks = getNetworkList(user);
  const hasFriends = friends.length > 0;

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
      <NetworkStrip
        networks={networks}
        isLoading={isProfileLoading}
        onCreateNetwork={() => {}}
      />
      <FriendsSidebar
        friends={friends}
        isLoading={isLoading}
        user={user}
        sessionUser={session?.user}
        onAddFriendClick={() => setIsSearchUserOpen(true)}
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onSignOut={handleSignOut} />
        <div className="flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 items-center justify-center p-6">
            {isLoading ? (
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
    </main>
  );
}
