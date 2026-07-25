"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import useWebSocket from "react-use-websocket";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL, contextFetcher, SOCKET_URL } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageType, ServerEvent } from "../types";
import { Message } from "@workspace/ui/components/message";
import { MessageComposer } from "./message-composer";
import EditInput from "./edit-input";

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

type OptimisticMessage = Omit<MessageType, "id"> & {
  optimistic: true;
};

type ChatMessageListItem = PersistedMessage | MessageType | OptimisticMessage;

const getMessagesQueryKey = (channelId: string) =>
  ["lastMessages", `${API_BASE_URL}/channels/${channelId}/messages`] as const;

const getMessageTimestamp = (message: ChatMessageListItem) =>
  "timestamp" in message ? message.timestamp : message.createdAt;

export const ChatSection = ({ channelId }: { channelId: string }) => {
  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<ServerEvent>(SOCKET_URL);
  const [message, setMessage] = useState("");
  const { data: session } = authClient.useSession();
  const { data, error, isError, isLoading } = useQuery({
    queryKey: getMessagesQueryKey(channelId),
    queryFn: (context) => contextFetcher<ChatMessageListItem[]>(context),
  });
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<{
    messageId: string;
    message: string;
  } | null>(null);
  const previousMessage = useRef(new Map<string, string>());

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

    switch (lastJsonMessage.type) {
      case "NEW_MESSAGE":
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

            return alreadyCached
              ? oldMessages
              : [lastJsonMessage, ...oldMessages];
          }
        );
        break;
      case "DELETE_MESSAGE":
        if (lastJsonMessage.status === "FAILED") {
          toast.error(lastJsonMessage.error?.message, {
            description: "Please try again later or report to the maintainer",
          });
        }

        queryClient.setQueryData<ChatMessageListItem[]>(
          getMessagesQueryKey(channelId),
          (oldMessages = []) =>
            oldMessages.filter(
              (msg) => "id" in msg && msg.id !== lastJsonMessage.messageId
            )
        );

        break;
      case "EDIT_MESSAGE":
        if (lastJsonMessage.status === "FAILED") {
          queryClient.setQueryData<ChatMessageListItem[]>(
            getMessagesQueryKey(channelId),
            (oldMessages = []) =>
              oldMessages.map((msg) =>
                "id" in msg && msg.id === lastJsonMessage.messageId
                  ? {
                      ...msg,
                      message:
                        previousMessage.current.get(
                          lastJsonMessage.messageId
                        ) ?? msg.message,
                    }
                  : msg
              )
          );

          toast.error(lastJsonMessage.error?.message, {
            description: "Please try again later or report to the maintainer",
          });
        }

        previousMessage.current.clear();
        break;
      case "ERROR":
        console.log(lastJsonMessage);
        toast.error(lastJsonMessage.error?.message, {
          description: "Please try again later or report to the maintainer",
          action: {
            label: "Report",
            onClick: () =>
              (window.location.href = "https://x.com/shazabsaifi_s9"),
          },
        });
        break;
      default:
        break;
    }
  }, [lastJsonMessage, queryClient, channelId]);

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

  const handleDeleteMessage = (messageId: string) => {
    sendJsonMessage({
      type: "DELETE_MESSAGE",
      channelId,
      messageId,
    });

    toast.success("Message Delete");
  };

  const handleEditMessage = (messageId: string, editedMessage: string) => {
    sendJsonMessage({
      type: "EDIT_MESSAGE",
      channelId,
      messageId,
      editedMessage,
    });

    const current = queryClient
      .getQueryData<ChatMessageListItem[]>(getMessagesQueryKey(channelId))
      ?.find((msg) => "id" in msg && msg.id === messageId);

    if (current) {
      previousMessage.current.set(messageId, current.message);
    }

    queryClient.setQueryData<ChatMessageListItem[]>(
      getMessagesQueryKey(channelId),
      (oldMessages = []) =>
        oldMessages.map((msg) =>
          "id" in msg && msg.id === messageId
            ? { ...msg, message: editedMessage }
            : msg
        )
    );

    setIsEditing(null);
    toast.success("Message Updates");
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
                messageId={"id" in message ? message.id : undefined}
                message={message.message}
                isSender={session?.user.id === message.sender.id}
                name={message.sender.name}
                avatarUrl={message.sender.image}
                avatarAlt={`avatar-${message.sender.name}`}
                timestamp={timestamp}
                endGroup={endsGroup}
                handleMsgDelete={handleDeleteMessage}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                EditInputComponent={
                  <EditInput
                    message={message.message}
                    messageId={("id" in message && message.id) as string}
                    handleEdit={handleEditMessage}
                    setIsEditing={setIsEditing}
                  />
                }
                isBeingEdit={!!previousMessage}
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
