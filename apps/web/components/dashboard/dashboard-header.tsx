import { Bell, Hash, LogOut, Inbox } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { TabSelect } from "@workspace/ui/components/tab-select";
import { ThemeToggle } from "./theme-toggle";

type DashboardHeaderProps = {
  onSignOut: () => void;
  activeChannelName?: string | null;
  variant?: "friends" | "network";
};

export function DashboardHeader({
  onSignOut,
  activeChannelName,
  variant = "friends",
}: DashboardHeaderProps) {
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
              tabs={["Online", "All", "Pending"]}
              tabClassName="px-3 py-1.5"
              gap="16px"
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Inbox">
          <Inbox className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Sign out"
          onClick={onSignOut}
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
