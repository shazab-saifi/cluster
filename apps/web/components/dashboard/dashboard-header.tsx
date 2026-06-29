import { Bell, SignOut, Tray, UserPlus, Users } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { ThemeToggle } from "./theme-toggle";

type DashboardHeaderProps = {
  onSignOut: () => void;
};

export function DashboardHeader({ onSignOut }: DashboardHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Users className="size-5 text-muted-foreground" />
        <h1 className="truncate font-semibold">Friends</h1>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="hidden items-center gap-1 sm:flex">
          <Button variant="secondary" size="sm">
            Online
          </Button>
          <Button variant="ghost" size="sm">
            All
          </Button>
          <Button variant="ghost" size="sm">
            Pending
          </Button>
          <Button size="sm">
            <UserPlus className="size-4" />
            Add Friend
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon-sm" aria-label="Inbox">
          <Tray className="size-4" />
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
          <SignOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
