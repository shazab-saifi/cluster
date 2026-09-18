"use client";

import React, { useEffect, useMemo } from "react";
import useWebSocket from "react-use-websocket";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { getNotifications, type NotificationsPage } from "@/lib/api";
import { SOCKET_URL } from "@/lib/utils";
import type { NotificationEvent } from "../types";
import { FriendRequestCard } from "./friend-request-card";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { LoaderCircle, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const NOTIFICATIONS_KEY = ["notifications"] as const;

type NotificationsInfiniteData = InfiniteData<NotificationsPage, string | null>;

function upsertNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  event: NotificationEvent
) {
  queryClient.setQueryData<NotificationsInfiniteData>(
    NOTIFICATIONS_KEY,
    (old) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page, index) => {
          if (index !== 0) return page;
          if (page.notifications.some((n) => n.id === event.id)) return page;

          return {
            ...page,
            notifications: [event, ...page.notifications],
          };
        }),
      };
    }
  );
}

function NotificationCard({
  notification,
}: {
  notification: NotificationEvent;
}) {
  switch (notification.type) {
    case "FRIEND_REQUEST":
      return <FriendRequestCard notification={notification} />;
    default:
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          You have a new notification
        </div>
      );
  }
}

function NotificationSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function NotificationPanel({
  open,
  onClose,
  onNewNotification,
}: {
  open: boolean;
  onClose: () => void;
  onNewNotification: () => void;
}) {
  const queryClient = useQueryClient();
  const { lastJsonMessage } = useWebSocket<NotificationEvent>(SOCKET_URL, {
    share: true,
  });

  const notificationsQuery = useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: ({ pageParam }) => getNotifications(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const notifications = useMemo(
    () =>
      notificationsQuery.data?.pages.flatMap((page) => page.notifications) ??
      [],
    [notificationsQuery.data]
  );

  useEffect(() => {
    if (!lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "FRIEND_REQUEST":
      case "MENTION":
      case "REACTION":
        upsertNotification(queryClient, lastJsonMessage);
        onNewNotification();
        break;
      default:
        break;
    }
  }, [lastJsonMessage, queryClient, onNewNotification]);

  const loadMore = () => {
    if (notificationsQuery.hasNextPage) {
      notificationsQuery.fetchNextPage();
    }
  };

  return (
    <section
      className={cn(
        "absolute inset-0 z-20 flex flex-col overflow-hidden border-border bg-background",
        !open && "hidden"
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h2 className="truncate font-semibold">Notifications</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close notifications"
          onClick={onClose}
        >
          <X className="size-5" />
        </Button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {notificationsQuery.isLoading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <div key={n.id} className="border-b border-border">
                <NotificationCard notification={n} />
              </div>
            ))}
            {notificationsQuery.hasNextPage ? (
              <div className="flex justify-center py-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={notificationsQuery.isFetchingNextPage}
                >
                  {notificationsQuery.isFetchingNextPage ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
