"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL, contextFetcher, SOCKET_URL } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageErrorType, MessageType } from "../types";
import { Message } from "@workspace/ui/components/message";
import { MessageComposer } from "./message-composer";

type ChatMessage = MessageType | MessageErrorType;
type PersistedMessage = {
  id: string;
  message: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
};
type OptimisticMessage = MessageType & {
  optimistic: true;
};
type ChatMessageListItem = PersistedMessage | MessageType | OptimisticMessage;

const getMessagesQueryKey = (channelId: string) =>
  ["lastMessages", `${API_BASE_URL}/channels/${channelId}/messages`] as const;

const getMessageTimestamp = (message: ChatMessageListItem) =>
  "timestamp" in message ? message.timestamp : message.createdAt;

export const ChatSection = ({ channelId }: { channelId: string }) => {
  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<ChatMessage>(SOCKET_URL);
  const [message, setMessage] = useState("");
  const { data: session } = authClient.useSession();
  const { data, error, isError, isLoading } = useQuery({
    queryKey: getMessagesQueryKey(channelId),
    queryFn: (context) => contextFetcher<ChatMessageListItem[]>(context),
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    sendJsonMessage({
      type: "JOIN_CHANNEL",
      channelId,
    });
  }, [channelId, sendJsonMessage]);

  const sortedMessages = useMemo(
    () =>
      data
        ? [...data].sort((a, b) => {
            const aTimestamp = getMessageTimestamp(a);
            const bTimestamp = getMessageTimestamp(b);

            return (
              new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime()
            );
          })
        : [],
    [data]
  );

  useEffect(() => {
    if (!lastJsonMessage) return;

    if (lastJsonMessage.type === "ERROR") {
      toast.error(lastJsonMessage.error.message, {
        description: "Please try again later or report to the maintainer",
        action: {
          label: "Report",
          onClick: () =>
            (window.location.href = "https://x.com/shazabsaifi_s9"),
        },
      });
      return;
    }

    queryClient.setQueryData<ChatMessageListItem[]>(
      getMessagesQueryKey(lastJsonMessage.channelId),
      (oldMessages = []) => {
        const optimisticIndex = oldMessages.findIndex(
          (cachedMessage) =>
            "optimistic" in cachedMessage &&
            cachedMessage.optimistic &&
            cachedMessage.channelId === lastJsonMessage.channelId &&
            cachedMessage.message === lastJsonMessage.message
        );

        if (optimisticIndex !== -1) {
          return oldMessages.map((cachedMessage, index) =>
            index === optimisticIndex ? lastJsonMessage : cachedMessage
          );
        }

        const alreadyCached = oldMessages.some(
          (cachedMessage) =>
            "timestamp" in cachedMessage &&
            cachedMessage.channelId === lastJsonMessage.channelId &&
            cachedMessage.timestamp === lastJsonMessage.timestamp &&
            cachedMessage.sender.id === lastJsonMessage.sender.id
        );

        return alreadyCached ? oldMessages : [lastJsonMessage, ...oldMessages];
      }
    );
  }, [lastJsonMessage, queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <SpinnerGapIcon
          weight="bold"
          className="size-8 animate-spin text-neutral-400"
        />
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

  const handleSendMessage = () => {
    const content = message.trim();
    if (content.length === 0) return;

    const optimisticMessage: OptimisticMessage = {
      type: "NEW_MESSAGE",
      channelId,
      message: content,
      sender: {
        id: session?.user.id,
        name: session?.user.name ?? "You",
        image: session?.user.image ?? null,
      },
      timestamp: new Date().toISOString(),
      optimistic: true,
    };

    queryClient.setQueryData<ChatMessageListItem[]>(
      getMessagesQueryKey(channelId),
      (oldMessages = []) => [optimisticMessage, ...oldMessages]
    );

    sendJsonMessage({
      type: "NEW_MESSAGE",
      channelId,
      message: content,
    });

    setMessage("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-4 pt-4">
        {sortedMessages.length !== 0 ? (
          sortedMessages.map((message, idx) => {
            const timestamp = getMessageTimestamp(message);
            const next = sortedMessages[idx + 1];
            const endsGroup = !next || next.sender.id !== message.sender.id;

            return (
              <Message
                key={
                  "id" in message
                    ? message.id
                    : `${message.channelId}-${message.timestamp}-${idx}`
                }
                message={message.message}
                name={message.sender.name}
                avatarUrl={message.sender.image}
                avatarAlt={`avatar-${message.sender.name}`}
                timestamp={timestamp}
                endGroup={endsGroup}
              />
            );
          })
        ) : (
          <p className="absolute top-1/2 left-1/2 mx-auto -translate-x-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            No message yet
          </p>
        )}
      </div>

      <MessageComposer
        message={message}
        setMessage={setMessage}
        channelId={channelId}
        handlerFn={handleSendMessage}
      />
    </div>
  );
};
