"use client";

import React, { useEffect } from "react";
import useWebSocket from "react-use-websocket";
import {
  getMessagesQueryKey,
  type MessagesPage,
  SOCKET_URL,
} from "@/lib/utils";
import { type InfiniteData, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ServerEvent } from "../types";
import { MessageComposer } from "./message-composer";
import { MessagesList } from "./messages-list";

export const ChatSection = ({ channelId }: { channelId: string }) => {
  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<ServerEvent>(SOCKET_URL);
  const queryClient = useQueryClient();

  useEffect(() => {
    sendJsonMessage({ type: "JOIN_CHANNEL", channelId });
  }, [channelId, sendJsonMessage]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    switch (lastJsonMessage.type) {
      case "NEW_MESSAGE":
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldData) =>
            oldData && {
              ...oldData,
              pages: oldData.pages.map((page, index) =>
                index === 0 &&
                !page.messages.some(
                  (message) => message.id === lastJsonMessage.id
                )
                  ? { ...page, messages: [lastJsonMessage, ...page.messages] }
                  : page
              ),
            }
        );
        break;
      case "EDIT_MESSAGE":
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldData) =>
            oldData && {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.map((message) =>
                  message.id === lastJsonMessage.messageId
                    ? {
                        ...message,
                        message: lastJsonMessage.editedMessage,
                        edited: true,
                      }
                    : message
                ),
              })),
            }
        );
        break;
      case "DELETE_MESSAGE":
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          getMessagesQueryKey(lastJsonMessage.channelId),
          (oldData) =>
            oldData && {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.filter(
                  (message) => message.id !== lastJsonMessage.messageId
                ),
              })),
            }
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

  return (
    <div className="flex flex-1 flex-col">
      <MessagesList channelId={channelId} sendJsonMessage={sendJsonMessage} />
      <MessageComposer
        channelId={channelId}
        sendJsonMessage={sendJsonMessage}
      />
    </div>
  );
};
