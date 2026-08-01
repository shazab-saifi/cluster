"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import useWebSocket from "react-use-websocket";
import { authClient } from "@/lib/auth-client";
import { API_BASE_URL, contextFetcher, SOCKET_URL } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageType, ServerEvent } from "../types";
import { Message } from "@workspace/ui/components/message";
import { MessageComposer } from "./message-composer";
import EditInput from "./edit-input";

const getMessagesQueryKey = (channelId: string) =>
  ["lastMessages", `${API_BASE_URL}/channels/${channelId}/messages`] as const;

const getMessageTimestamp = (message: MessageType) => message.timestamp;

export const ChatSection = ({ channelId }: { channelId: string }) => {
  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<ServerEvent>(SOCKET_URL);
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState("");
  const { data, error, isError, isLoading } = useQuery({
    queryKey: getMessagesQueryKey(channelId),
    queryFn: (context) => contextFetcher<MessageType[]>(context),
  });
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState<{
    messageId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    sendJsonMessage({ type: "JOIN_CHANNEL", channelId });
  }, [channelId, sendJsonMessage]);

  const sortedMessages = useMemo(
    () =>
      data
        ? [...data].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        : [],
    [data]
  );

  useEffect(() => {
    if (!lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "NEW_MESSAGE":
        queryClient.setQueryData<MessageType[]>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldMessages = []) =>
            oldMessages.some((message) => message.id === lastJsonMessage.id)
              ? oldMessages
              : [lastJsonMessage, ...oldMessages]
        );
        break;
      case "EDIT_MESSAGE":
        queryClient.setQueryData<MessageType[]>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldMessages = []) =>
            oldMessages.map((message) =>
              message.id === lastJsonMessage.messageId
                ? {
                    ...message,
                    message: lastJsonMessage.editedMessage,
                    edited: true,
                  }
                : message
            )
        );
        break;
      case "DELETE_MESSAGE":
        queryClient.setQueryData<MessageType[]>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldMessages = []) =>
            oldMessages.filter(
              (message) => message.id !== lastJsonMessage.messageId
            )
        );
        break;
      case "ERROR":
        toast.error(lastJsonMessage.error.message, {
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

    sendJsonMessage({
      type: "NEW_MESSAGE",
      channelId,
      clientRequestId: crypto.randomUUID(),
      message: content,
    });
    setMessage("");
  };

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
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-4 pt-4">
        {sortedMessages.length !== 0 ? (
          sortedMessages.map((message, idx) => {
            const next = sortedMessages[idx + 1];
            const endsGroup = !next || next.sender.id !== message.sender.id;

            return (
              <Message
                key={message.id}
                messageId={message.id}
                message={message.message}
                isSender={session?.user.id === message.sender.id}
                name={message.sender.name}
                avatarUrl={message.sender.image}
                avatarAlt={`avatar-${message.sender.name}`}
                edited={message.edited}
                timestamp={getMessageTimestamp(message)}
                endGroup={endsGroup}
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
