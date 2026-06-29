"use client";

import {
  PaperPlaneTiltIcon,
  PlusIcon,
  SmileyIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import { KeyboardEvent, useEffect, useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import useWebSocket from "react-use-websocket";
import { API_BASE_URL, contextFetcher } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

type ChatMessage = {
  type: "NEW_MESSAGE" | "SUCCESS";
  payload: {
    channelId: string;
    senderId: string;
    content: string;
  };
};

export const ChatSection = ({ channelId }: { channelId: string }) => {
  const socketUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080"
      : "https://cluster.shazab.site";
  const { sendJsonMessage, lastJsonMessage } = useWebSocket<ChatMessage>(
    socketUrl,
    {
      onOpen: () => console.log("opened"),
    }
  );
  const [message, setMessage] = useState<string>("");
  const [msgHistory, setMsgHistory] = useState<ChatMessage[]>([]);
  const { data: session } = authClient.useSession();
  const { data, error, isError, isLoading } = useQuery({
    queryKey: [
      "lastMessages",
      `${API_BASE_URL}/channels/${channelId}/messages`,
    ],
    queryFn: contextFetcher,
  });

  useEffect(() => {
    if (data) {
      const mappedData = data.messages.map((msg: any) => ({
        type: "NEW_MESSAGE",
        payload: {
          channelId: msg.channelId,
          senderId: msg.senderId,
          content: msg.message,
        },
      }));
      setMsgHistory(mappedData);
    }
  }, [data]);

  useEffect(() => {
    function handleNewMsg() {
      if (!lastJsonMessage) return;

      if (lastJsonMessage.type === "NEW_MESSAGE") {
        setMsgHistory((prev) => [...prev, lastJsonMessage]);
      }
    }

    handleNewMsg();
  }, [lastJsonMessage]);

  useEffect(() => {
    sendJsonMessage({
      type: "JOIN_CHANNEL",
      payload: {
        channelId,
      },
    });
  }, [channelId]);

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
    if (message.trim().length === 0) return;

    sendJsonMessage({
      type: "SEND_MESSAGE",
      payload: {
        channelId,
        content: message,
      },
    });

    setMsgHistory((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        type: "NEW_MESSAGE",
        payload: {
          senderId: session?.user.id as string,
          channelId,
          content: message,
        },
      },
    ]);
    setMessage("");
  };

  const handleEnterKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pt-4">
        {msgHistory && msgHistory.length !== 0 ? (
          msgHistory.map((message, idx) => (
            <p
              key={idx}
              className="font-semibold text-neutral-950 dark:text-neutral-100"
            >
              {message.payload.content}
            </p>
          ))
        ) : (
          <p className="mx-auto text-sm text-muted-foreground">
            No message yet
          </p>
        )}
      </div>

      <form
        className="sticky bottom-0 shrink-0 bg-background px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Add attachment"
            className="text-muted-foreground hover:text-foreground"
          >
            <PlusIcon className="size-5" weight="bold" />
          </Button>

          <Input
            aria-label={`Message channel ${channelId}`}
            placeholder="Write message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleEnterKey}
            className="h-full flex-1 border-0 bg-transparent px-1 shadow-none placeholder:text-sm focus-visible:ring-0 dark:bg-transparent"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Choose emoji"
            className="text-muted-foreground hover:text-foreground"
          >
            <SmileyIcon className="size-5" />
          </Button>

          <Button
            type="submit"
            size="icon-lg"
            className="hover:bg-indigo-400 dark:hover:bg-indigo-400"
            aria-label="Send message"
          >
            <PaperPlaneTiltIcon className="size-5" />
          </Button>
        </div>
      </form>
    </div>
  );
};
