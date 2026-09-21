"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { MessageActions } from "./message-actions";
import EditInput from "./edit-input";

type MessageSender = {
  id?: string;
  name: string;
  image: string | null;
};

type MessageData = {
  id: string;
  message: string;
  sender: MessageSender;
  timestamp: Date | string;
  edited?: boolean;
};

type MessageProps = {
  message: MessageData;
  isSender: boolean;
  className?: string;
  showHeader?: boolean;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, editedMessage: string) => void;
};

const getLocale = () =>
  typeof navigator !== "undefined" ? navigator.language : "en";

const customDateTimeFormatter = (date: Date) => {
  const locale = getLocale();

  const datePart = date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timePart = date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart}`;
};

function Message({
  message,
  isSender,
  className,
  showHeader,
  onDelete,
  onEdit,
}: MessageProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { id, sender, timestamp, edited = false } = message;
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hasValidTimestamp =
    date instanceof Date && !Number.isNaN(date.getTime());
  const editingMsg = isEditing;

  const handleSaveEdit = (editedMessage: string) => {
    onEdit?.(id, editedMessage);
    setIsEditing(false);
  };

  return (
    <article
      className={cn(
        "group relative z-0 flex items-start gap-3 rounded-lg px-2 transition-colors",
        showHeader && "mt-4 py-0.5",
        isActionsOpen && "z-10 bg-tertiary",
        editingMsg && "bg-tertiary py-2",
        !editingMsg && "hover:z-10 hover:bg-tertiary",
        className
      )}
    >
      {showHeader && (
        <Avatar size="lg" aria-label={`avatar-${sender.name}`}>
          {sender.image ? (
            <AvatarImage src={sender.image} alt={`avatar-${sender.name}`} />
          ) : null}
          <AvatarFallback>{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("min-w-0 flex-1", !showHeader && "pl-13")}>
        {showHeader && (
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {sender.name}
            </p>
            {hasValidTimestamp ? (
              <time
                dateTime={date.toISOString()}
                title={date.toISOString()}
                className="text-xs text-muted-foreground"
              >
                {customDateTimeFormatter(date)}
              </time>
            ) : null}
          </header>
        )}

        <div className="flex flex-1 items-center justify-between">
          {editingMsg ? (
            <EditInput
              message={message.message}
              messageId={id}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90">
              {message.message}
              {edited ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  (edited)
                </span>
              ) : null}
            </p>
          )}

          {!editingMsg && isSender && (
            <MessageActions
              isOpen={isActionsOpen}
              message={message.message}
              onOpenChange={setIsActionsOpen}
              onDelete={() => onDelete?.(id)}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export type { MessageData, MessageProps };
export default React.memo(Message);
