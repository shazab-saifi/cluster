"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getFriends,
  getIncomingFriendRequests,
  getMe,
  getOutgoingFriendRequests,
} from "@/lib/api";
import { DashboardHeader } from "./dashboard-header";
import { ActiveNow } from "./active-now";
import { ChatPanel } from "./chat-panel/chat-panel";
import { EmptyFriends, FriendsSidebar, getFriend } from "./friends-sidebar";
import { IncomingRequests } from "./friends-tabs/incoming-requests";
import { OutgoingRequests } from "./friends-tabs/outgoing-requests";
import { SearchUserDialog } from "./friends-tabs/search-user";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import NetworkStrip from "./network-strip";
import { NotificationPanel } from "./notification-panel/notification-panel";
import { getNetworkList } from "@/lib/utils";
import { useState, useCallback } from "react";
import type { FriendsTab } from "./types";

export function FriendsDashboard({ friendshipId }: { friendshipId?: string }) {
  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FriendsTab>("Online");
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    meta: { requiresAuth: true },
  });
  const { data: friends = [], isLoading: isFriendsLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    enabled: Boolean(friendshipId),
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

  const activeFriendship = friendshipId
    ? friends.find((friendship) => friendship.id === friendshipId)
    : undefined;
  const activeFriend = activeFriendship
    ? getFriend(activeFriendship, user)
    : undefined;
  const isDmOpen = Boolean(friendshipId);

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
        user={user}
        onAddFriendClick={() => setIsSearchUserOpen(true)}
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          variant={isDmOpen ? "dm" : "friends"}
          activeChatName={activeFriend?.name ?? activeFriend?.username ?? null}
          activeFriendsTab={activeTab}
          onFriendsTabChange={setActiveTab}
          onNotificationsClick={toggleNotifications}
          showNotifications={showNotifications}
          unreadCount={unreadCount}
        />
        <div className="relative flex min-h-0 flex-1">
          {isDmOpen ? (
            activeFriendship ? (
              <>
                <ChatPanel
                  room={{ kind: "friendship", id: activeFriendship.id }}
                />
                <ActiveNow activeFriend={activeFriend} />
              </>
            ) : (
              <section className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-6">
                <p className="text-center text-sm text-muted-foreground">
                  {isFriendsLoading
                    ? "Loading conversation"
                    : "Conversation not found"}
                </p>
              </section>
            )
          ) : activeTab === "Incoming" ? (
            <IncomingRequests
              requests={incomingRequests}
              isLoading={isIncomingLoading}
            />
          ) : activeTab === "Outgoing" ? (
            <OutgoingRequests
              requests={outgoingRequests}
              isLoading={isOutgoingLoading}
            />
          ) : (
            <section className="flex min-w-0 flex-1 items-center justify-center p-6">
              <p className="text-center text-sm text-muted-foreground">
                Seems like no one is online
              </p>
            </section>
          )}
          {!isDmOpen && (
            <aside className="hidden w-90 shrink-0 items-center justify-center border-l p-6 xl:flex">
              <EmptyFriends showAction={false} />
            </aside>
          )}
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
