"use client";

import { ArrowUp, Plus } from "lucide-react";
import { SmileyIcon } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import React, { useState } from "react";
import { SendJsonMessage } from "react-use-websocket/dist/lib/types";

type MessageComposer = {
  channelId: string;
  sendJsonMessage: SendJsonMessage;
};

export const MessageComposer = ({
  channelId,
  sendJsonMessage,
}: MessageComposer) => {
  const [message, setMessage] = useState("");

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

  return (
    <form
      className="sticky bottom-0 shrink-0 bg-background p-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSendMessage();
      }}
    >
      <div className="flex items-center rounded-xl bg-tertiary p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Add attachment"
        >
          <Plus className="size-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Choose emoji"
        >
          <SmileyIcon weight="fill" className="size-5 text-foreground" />
        </Button>

        <Input
          aria-label={`Message channel ${channelId}`}
          placeholder="Write message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="ml-2 h-full flex-1 border-0 bg-transparent px-1 shadow-none placeholder:text-sm focus-visible:ring-0 dark:bg-transparent"
        />

        <Button
          type="submit"
          size="icon-lg"
          className="bg-accent hover:bg-accent/80 dark:hover:bg-accent/80"
          aria-label="Send message"
        >
          <ArrowUp className="size-5 stroke-3" />
        </Button>
      </div>
    </form>
  );
};
