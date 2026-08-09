"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { MessageActions } from "./message-actions";

type MessageProps = {
  messageId?: string;
  name: string;
  timestamp: Date | string;
  message: string;
  isSender: boolean;
  avatarUrl?: string | null;
  avatarAlt?: string;
  className?: string;
  endGroup?: boolean;
  edited?: boolean;
  handleMsgDelete: (messageId: string) => void;
  isEditing: { messageId: string; message: string } | null;
  setIsEditing: ({
    messageId,
    message,
  }: {
    messageId: string;
    message: string;
  }) => void;
  EditInputComponent: React.ReactNode;
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
  messageId,
  name,
  timestamp,
  message,
  isSender,
  avatarUrl,
  avatarAlt,
  className,
  endGroup,
  edited = false,
  handleMsgDelete,
  isEditing,
  setIsEditing,
  EditInputComponent,
}: MessageProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hasValidTimestamp =
    date instanceof Date && !Number.isNaN(date.getTime());
  const editingMsg =
    messageId !== undefined && isEditing?.messageId === messageId;

  return (
    <article
      className={cn(
        "group relative z-0 flex items-start gap-3 rounded-lg px-2 transition-colors",
        endGroup && "mt-4 py-0.5",
        isActionsOpen && "z-10 bg-tertiary",
        editingMsg && "bg-secondary py-2",
        !editingMsg && "hover:z-10 hover:bg-tertiary",
        className
      )}
    >
      {endGroup && (
        <Avatar size="lg" aria-label={avatarAlt ?? "'s avatar"}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={avatarAlt} /> : null}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("min-w-0 flex-1", !endGroup && "pl-13")}>
        {endGroup && (
          <header className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold text-foreground">
              {name}
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
            EditInputComponent
          ) : (
            <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90">
              {message}
              {edited ? (
                <span className="ml-1 text-xs text-muted-foreground">
                  (edited)
                </span>
              ) : null}
            </p>
          )}

          {!editingMsg && isSender && messageId && (
            <MessageActions
              messageId={messageId}
              isOpen={isActionsOpen}
              message={message}
              onOpenChange={setIsActionsOpen}
              handleMsgDelete={handleMsgDelete}
              setIsEditing={setIsEditing}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export type { MessageProps };
export default React.memo(Message);
