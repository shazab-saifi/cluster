import { cn, getInitials } from "@workspace/ui/lib/utils";
import type { NetworkListItem } from "./types";

type NetworkAvatarProps = {
  network: NetworkListItem;
  active: boolean;
  onClick: () => void;
};

export function NetworkAvatar({
  network,
  active,
  onClick,
}: NetworkAvatarProps) {
  return (
    <button
      type="button"
      aria-label={network.name}
      title={network.name}
      aria-pressed={active}
      className="group relative flex h-12 w-12 shrink-0 items-center justify-center"
      onClick={onClick}
    >
      <span
        className={cn(
          "absolute -left-3 h-2 w-1 rounded-r-full bg-foreground transition-all",
          active ? "h-9" : "group-hover:h-5"
        )}
      />
      <span
        className={cn(
          "grid size-9.5 place-items-center overflow-hidden rounded-2xl bg-muted text-sm font-semibold text-muted-foreground transition-all group-hover:rounded-xl group-hover:bg-primary group-hover:text-primary-foreground",
          active &&
            "rounded-xl bg-primary text-primary-foreground ring-3 ring-primary ring-offset-2 ring-offset-card"
        )}
      >
        {network.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={network.image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(network.name)
        )}
      </span>
    </button>
  );
}
