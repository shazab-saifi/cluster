import { ChevronsUpDown } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { getInitials } from "@workspace/ui/lib/utils";
import { UserDialog } from "./user-manage/user-dialog";
import type { DashboardUser } from "./types";

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
    <div className="flex items-center gap-2 border-t bg-background/60 p-4">
      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-base font-semibold">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="truncate text-xs font-medium text-green-500">
          Online
        </span>
      </div>

      <UserDialog
        user={user}
        sessionUser={sessionUser}
        trigger={
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Open profile settings"
            title="Open profile settings"
          >
            <ChevronsUpDown className="size-5" />
          </Button>
        }
      />
    </div>
  );
}
