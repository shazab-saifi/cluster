"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import { MessageManage } from "./message-actions";

type MessageProps = {
  name: string;
  timestamp: Date | string;
  message: string;
  avatarUrl?: string | null;
  avatarAlt?: string;
  className?: string;
  endGroup?: boolean;
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

export function Message({
  name,
  timestamp,
  message,
  avatarUrl,
  avatarAlt,
  className,
  endGroup,
}: MessageProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const hasValidTimestamp =
    date instanceof Date && !Number.isNaN(date.getTime());

  return (
    <article
      className={cn(
        "group relative z-0 flex items-start gap-3 rounded-lg px-2 transition-colors focus-within:z-10 focus-within:bg-accent hover:z-10 hover:bg-accent",
        endGroup && "mt-4 py-0.5",
        isActionsOpen && "z-10 bg-accent",
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
          <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap text-foreground/90">
            {message}
          </p>
          <MessageManage
            isOpen={isActionsOpen}
            message={message}
            onOpenChange={setIsActionsOpen}
          />
        </div>
      </div>
    </article>
  );
}

export type { MessageProps };
