"use client";

import { Bell, Hash, LogOut } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { TabSelect } from "@workspace/ui/components/tab-select";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@workspace/ui/lib/utils";
import { useHandleSignOut } from "@/lib/use-handle-sign-out";
import type { FriendsTab } from "./types";

type DashboardHeaderProps = {
  activeChannelName?: string | null;
  variant?: "friends" | "network";
  activeFriendsTab?: FriendsTab;
  onFriendsTabChange?: (tab: FriendsTab) => void;
  onNotificationsClick?: () => void;
  showNotifications?: boolean;
  unreadCount?: number;
};

export function DashboardHeader({
  activeChannelName,
  variant = "friends",
  activeFriendsTab,
  onFriendsTabChange,
  onNotificationsClick,
  showNotifications,
  unreadCount = 0,
}: DashboardHeaderProps) {
  const handleSignOut = useHandleSignOut();
  const isNetworkHeader = variant === "network";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        {isNetworkHeader ? (
          <>
            <Hash className="size-5 shrink-0 text-muted-foreground" />
            <h1 className="truncate font-semibold">
              {activeChannelName ?? "Channel"}
            </h1>
          </>
        ) : (
          <>
            <TabSelect
              tabs={["Online", "All", "Incoming", "Outgoing"]}
              activeTab={activeFriendsTab}
              setActiveTab={(tab: string) =>
                onFriendsTabChange?.(tab as FriendsTab)
              }
              tabClassName="px-4 py-1.5"
              gap="16px"
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
          onClick={onNotificationsClick}
          className={cn(showNotifications && "bg-muted text-foreground")}
        >
          <span className="relative size-5">
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </span>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Sign out"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
