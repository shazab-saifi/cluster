import { Crown, HelpCircle, Inbox, Plus, Users } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import type { DashboardUser, NetworkListItem } from "./types";
import { getInitials } from "./utils";
import { UserFooter } from "./user-footer";

type DashboardSidebarProps = {
  networks: NetworkListItem[];
  activeNetwork?: NetworkListItem;
  user?: DashboardUser;
  sessionUser?: {
    name?: string | null;
    image?: string | null;
  };
  onCreateNetwork: () => void;
};

export function DashboardSidebar({
  networks,
  activeNetwork,
  user,
  sessionUser,
  onCreateNetwork,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r bg-card md:flex">
      <div className="border-b p-3">
        <Input
          aria-label="Find or start a conversation"
          placeholder="Find or start a conversation"
          className="h-9 bg-background"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Button
          type="button"
          variant="secondary"
          className="h-11 justify-start gap-3 px-3 text-base"
        >
          <Users className="size-5" />
          Friends
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start gap-3 px-3 text-base text-muted-foreground"
        >
          <Inbox className="size-5" />
          Inbox
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 justify-start gap-3 px-3 text-base text-muted-foreground"
        >
          <HelpCircle className="size-5" />
          Help
        </Button>

        <div className="mt-4 flex items-center justify-between px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <span>Networks</span>
          <button
            type="button"
            aria-label="Create network"
            title="Create network"
            className="rounded p-0.5 transition hover:bg-muted hover:text-foreground"
            onClick={onCreateNetwork}
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {networks.map((network) => (
            <button
              key={network.id}
              type="button"
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
                network.id === activeNetwork?.id && "bg-muted text-foreground"
              )}
            >
              <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-md bg-background text-xs font-semibold">
                {network.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={network.image}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  getInitials(network.name)
                )}
              </span>
              <span className="min-w-0 flex-1 truncate">{network.name}</span>
              {network.role === "OWNER" && <Crown className="size-4" />}
            </button>
          ))}
        </div>
      </nav>
      <UserFooter user={user} sessionUser={sessionUser} />
    </aside>
  );
}
