import { motion } from "motion/react";
import { cn, getInitials } from "@workspace/ui/lib/utils";
import type { NetworkListItem } from "./types";

type NetworkAvatarProps = {
  network: NetworkListItem;
  active: boolean;
  indicatorLayoutId: string;
  onClick: () => void;
};

export function NetworkAvatar({
  network,
  active,
  indicatorLayoutId,
  onClick,
}: NetworkAvatarProps) {
  return (
    <button
      type="button"
      aria-label={network.name}
      title={network.name}
      aria-pressed={active}
      className="group relative flex h-11 w-14 shrink-0 items-center justify-end"
      onClick={onClick}
    >
      {active ? (
        <motion.span
          layoutId={indicatorLayoutId}
          className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-foreground"
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
        />
      ) : null}
      <span
        className={cn(
          "grid size-11 place-items-center overflow-hidden rounded-xl bg-muted text-sm font-semibold text-muted-foreground transition-all group-hover:bg-primary group-hover:text-primary-foreground",
          active && "rounded-lg bg-primary text-primary-foreground"
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
