import { Settings, Mic } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { DashboardUser } from "./types";
import { getInitials } from "@workspace/ui/lib/utils";

type UserFooterProps = {
  user?: DashboardUser;
  sessionUser?: {
    name?: string | null;
    image?: string | null;
  };
};

export function UserFooter({ user, sessionUser }: UserFooterProps) {
  const image = user?.image ?? sessionUser?.image;
  const name = user?.name ?? sessionUser?.name ?? "User";

  return (
    <div className="flex h-16 items-center gap-2 border-t bg-background/60 p-2">
      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-base font-semibold">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{name}</div>
        <div className="truncate text-base text-muted-foreground">
          {user?.username ? `@${user.username}` : "Online"}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Mute"
        title="Mute"
      >
        <Mic className="size-6" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Settings"
        title="Settings"
      >
        <Settings className="size-6" />
      </Button>
    </div>
  );
}
