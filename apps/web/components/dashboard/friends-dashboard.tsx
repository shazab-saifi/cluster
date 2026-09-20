"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getFriends,
  getIncomingFriendRequests,
  getMe,
  getOutgoingFriendRequests,
} from "@/lib/api";
import { DashboardHeader } from "./dashboard-header";
import { EmptyFriends, FriendsSidebar } from "./friends-sidebar";
import { IncomingRequests } from "./friends-tabs/incoming-requests";
import { OutgoingRequests } from "./friends-tabs/outgoing-requests";
import { SearchUserDialog } from "./friends-tabs/search-user";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import NetworkStrip from "./network-strip";
import { NotificationPanel } from "./notification-panel/notification-panel";
import { getNetworkList } from "@/lib/utils";
import { useState, useCallback } from "react";
import type { FriendsTab } from "./types";

export function FriendsDashboard() {
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FriendsTab>("Online");
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    meta: { requiresAuth: true },
  });
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    meta: { requiresAuth: true },
  });
  const { data: incomingRequests = [], isLoading: isIncomingLoading } =
    useQuery({
      queryKey: ["incoming-friend-requests"],
      queryFn: getIncomingFriendRequests,
      enabled: activeTab === "Incoming",
      meta: { requiresAuth: true },
    });
  const { data: outgoingRequests = [], isLoading: isOutgoingLoading } =
    useQuery({
      queryKey: ["outgoing-friend-requests"],
      queryFn: getOutgoingFriendRequests,
      enabled: activeTab === "Outgoing",
      meta: { requiresAuth: true },
    });

  const user = profile?.userData;
  const networks = getNetworkList(user);
  const hasFriends = friends.length > 0;

  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleNotifications = useCallback(() => {
    setShowNotifications((open) => {
      if (!open) setUnreadCount(0);
      return !open;
    });
  }, []);

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
          activeFriendsTab={activeTab}
          onFriendsTabChange={setActiveTab}
          onNotificationsClick={toggleNotifications}
          showNotifications={showNotifications}
          unreadCount={unreadCount}
        />
        <div className="relative flex min-h-0 flex-1">
          <section className="flex min-w-0 flex-1 items-center justify-center p-6">
            {activeTab === "Incoming" ? (
              <IncomingRequests
                requests={incomingRequests}
                isLoading={isIncomingLoading}
              />
            ) : activeTab === "Outgoing" ? (
              <OutgoingRequests
                requests={outgoingRequests}
                isLoading={isOutgoingLoading}
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
          <NotificationPanel
            open={showNotifications}
            onClose={() => setShowNotifications(false)}
            onNewNotification={() => setUnreadCount((c) => c + 1)}
          />
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
