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
import { ChatRoom, ServerEvent } from "../types";
import { MessageComposer } from "./message-composer";
import { MessagesList } from "./messages-list";

type RoomEvent = { channelId?: string; friendshipId?: string };

const targetsCurrentRoom = (event: RoomEvent, roomId: string) =>
  event.channelId === roomId || event.friendshipId === roomId;

export const ChatPanel = ({ room }: { room: ChatRoom }) => {
  const { sendJsonMessage, lastJsonMessage } =
    useWebSocket<ServerEvent>(SOCKET_URL);
  const queryClient = useQueryClient();

  useEffect(() => {
    sendJsonMessage(
      room.kind === "channel"
        ? { type: "JOIN_CHANNEL", channelId: room.id }
        : { type: "JOIN_FRIENDSHIP", friendshipId: room.id }
    );
  }, [room.kind, room.id, sendJsonMessage]);

  useEffect(() => {
    if (!lastJsonMessage) return;

    const messagesQueryKey = getMessagesQueryKey(room.kind, room.id);

    switch (lastJsonMessage.type) {
      case "NEW_MESSAGE":
        if (!targetsCurrentRoom(lastJsonMessage, room.id)) break;
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          messagesQueryKey,
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
        if (!targetsCurrentRoom(lastJsonMessage, room.id)) break;
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          messagesQueryKey,
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
        if (!targetsCurrentRoom(lastJsonMessage, room.id)) break;
        queryClient.setQueryData<InfiniteData<MessagesPage, string | null>>(
          messagesQueryKey,
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
  }, [lastJsonMessage, queryClient, room.kind, room.id]);

  return (
    <div className="flex flex-1 flex-col">
      <MessagesList room={room} sendJsonMessage={sendJsonMessage} />
      <MessageComposer room={room} sendJsonMessage={sendJsonMessage} />
    </div>
  );
};
