import { ChatCircle, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import type { DashboardUser, NetworkListItem } from "./types";
import { getInitials } from "./utils";

type FriendsPanelProps = {
  user?: DashboardUser;
  networks: NetworkListItem[];
  isLoading: boolean;
  hasError: boolean;
};

export function FriendsPanel({
  user,
  networks,
  isLoading,
  hasError,
}: FriendsPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col p-4">
      <label className="relative mb-5 block">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search friends"
          placeholder="Search"
          className="h-11 pl-10"
        />
      </label>

      <div className="mb-3 text-sm font-semibold">
        Online - {user ? Math.max(networks.length, 1) : 0}
      </div>

      <div className="divide-y">
        {(hasError || networks.length === 0) && !isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            {hasError
              ? "Could not load your networks."
              : "No networks found yet."}
          </div>
        ) : (
          networks.slice(0, 6).map((network) => (
            <div
              key={network.id}
              className="flex h-16 items-center gap-3 rounded-lg px-2 transition hover:bg-muted/70"
            >
              <div className="grid size-10 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
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
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{network.name}</span>
                  {network.role === "OWNER" && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground uppercase">
                      Owner
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {network.type.toLowerCase()} network
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label="Open chat">
                <ChatCircle className="size-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
