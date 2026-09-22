"use client";

import { MessageSkeleton } from "./message-skeleton";
import React, { useEffect, useMemo, useRef } from "react";
import { ChatRoom, MessageType } from "../types";
import Message from "./message";
import { FriendProfileCard } from "./friend-profile-card";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMessages, getMessagesQueryKey } from "@/lib/utils";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatDatePill = (timestamp: MessageType["timestamp"]) => {
  const date = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameCalendarDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface MessagesListProps {
  room: ChatRoom;
  sendJsonMessage: SendJsonMessage;
}

export const MessagesList = ({ room, sendJsonMessage }: MessagesListProps) => {
  const loadMoreRef = useRef(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: getMessagesQueryKey(room.kind, room.id),
    queryFn: fetchMessages,
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
    meta: { requiresAuth: true },
  });

  const sortedMessages = useMemo(
    () =>
      data
        ? data.pages
            .flatMap((page) => page.messages)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
        : [],
    [data]
  );

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    const current = loadMoreRef.current;

    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col gap-8 px-2">
        {Array.from({ length: 8 }).map((_, idx) => (
          <MessageSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-center font-medium text-destructive">
            {error.message}
          </p>
          <p className="text-center font-medium text-neutral-400">
            Please try again later
          </p>
        </div>
      </div>
    );
  }

  const handleDeleteMessage = (messageId: string) => {
    sendJsonMessage({
      type: "DELETE_MESSAGE",
      ...(room.kind === "channel"
        ? { channelId: room.id }
        : { friendshipId: room.id }),
      messageId,
      clientRequestId: crypto.randomUUID(),
    });
  };

  const handleEditMessage = (messageId: string, editedMessage: string) => {
    sendJsonMessage({
      type: "EDIT_MESSAGE",
      ...(room.kind === "channel"
        ? { channelId: room.id }
        : { friendshipId: room.id }),
      messageId,
      editedMessage,
      clientRequestId: crypto.randomUUID(),
    });
  };

  return (
    <div className="custom-scrollbar relative flex flex-1 flex-col-reverse overflow-y-auto px-4 pt-4">
      <div className="flex-1" aria-hidden />
      {sortedMessages.length !== 0 ? (
        sortedMessages.map((message, idx) => {
          const next = sortedMessages[idx + 1];
          const endsGroup = !next || next.sender.id !== message.sender.id;
          const currDay = new Date(message.timestamp).toLocaleDateString();
          const currDayLabel = formatDatePill(message.timestamp);
          const nextDay = next && new Date(next.timestamp).toLocaleDateString();
          const startsNewDay = !nextDay || nextDay !== currDay;

          return (
            <React.Fragment key={message.id}>
              <Message
                message={message}
                showHeader={startsNewDay || endsGroup}
                onDelete={handleDeleteMessage}
                onEdit={handleEditMessage}
              />
              {startsNewDay && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="h-0.5 flex-1 bg-tertiary text-xs text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {currDayLabel}
                  </p>
                  <span className="h-0.5 flex-1 bg-tertiary text-xs text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          );
        })
      ) : room.kind === "channel" ? (
        <p className="absolute top-1/2 left-1/2 mx-auto -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          No message yet
        </p>
      ) : null}
      {isFetchingNextPage && <MessageSkeleton />}
      {room.kind === "friendship" && !hasNextPage && (
        <FriendProfileCard friendshipId={room.id} />
      )}
      <div ref={loadMoreRef} />
    </div>
  );
};
