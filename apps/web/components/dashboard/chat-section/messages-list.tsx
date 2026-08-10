"use client";

import { MessageSkeleton } from "@workspace/ui/components/message-skeleton";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageType } from "../types";
import Message from "@workspace/ui/components/message";
import EditInput from "./edit-input";
import { authClient } from "@/lib/auth-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMessages, getMessagesQueryKey } from "@/lib/utils";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

const getMessageTimestamp = (message: MessageType) => message.timestamp;

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
  channelId: string;
  sendJsonMessage: SendJsonMessage;
}

export const MessagesList = ({
  channelId,
  sendJsonMessage,
}: MessagesListProps) => {
  const { data: session } = authClient.useSession();
  const loadMoreRef = useRef(null);
  const [isEditing, setIsEditing] = useState<{
    messageId: string;
    message: string;
  } | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: getMessagesQueryKey(channelId),
    queryFn: fetchMessages,
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
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
      channelId,
      messageId,
      clientRequestId: crypto.randomUUID(),
    });
  };

  const handleEditMessage = (messageId: string, editedMessage: string) => {
    sendJsonMessage({
      type: "EDIT_MESSAGE",
      channelId,
      messageId,
      editedMessage,
      clientRequestId: crypto.randomUUID(),
    });
    setIsEditing(null);
  };

  return (
    <div className="custom-scrollbar flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-4 pt-4">
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
                messageId={message.id}
                message={message.message}
                isSender={session?.user.id === message.sender.id}
                name={message.sender.name}
                avatarUrl={message.sender.image}
                avatarAlt={`avatar-${message.sender.name}`}
                edited={message.edited}
                timestamp={getMessageTimestamp(message)}
                endGroup={startsNewDay || endsGroup}
                handleMsgDelete={handleDeleteMessage}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                EditInputComponent={
                  <EditInput
                    message={message.message}
                    messageId={message.id}
                    handleEdit={handleEditMessage}
                    setIsEditing={setIsEditing}
                  />
                }
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
      ) : (
        <p className="absolute top-1/2 left-1/2 mx-auto -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          No message yet
        </p>
      )}
      {isFetchingNextPage && <MessageSkeleton />}
      <div ref={loadMoreRef} />
    </div>
  );
};
