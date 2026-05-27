import { Compass, MessageCircle, Plus } from "lucide-react";

import type { NetworkListItem } from "./types";
import { NetworkAvatar } from "./network-avatar";

type NetworkStripProps = {
  networks: NetworkListItem[];
  activeNetwork?: NetworkListItem;
  isLoading: boolean;
  onSelectNetwork: (network: NetworkListItem) => void;
  onCreateNetwork: () => void;
};

export function NetworkStrip({
  networks,
  activeNetwork,
  isLoading,
  onSelectNetwork,
  onCreateNetwork,
}: NetworkStripProps) {
  return (
    <aside className="flex w-[72px] shrink-0 flex-col items-center gap-2 border-r bg-card px-3 py-3">
      <button
        type="button"
        aria-label="Direct messages"
        title="Direct messages"
        className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
      >
        <MessageCircle className="size-6" />
      </button>
      <div className="my-1 h-px w-8 bg-border" />
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="size-12 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        {networks.map((network) => (
          <NetworkAvatar
            key={network.id}
            network={network}
            active={network.id === activeNetwork?.id}
            onClick={() => onSelectNetwork(network)}
          />
        ))}
      </div>
      <button
        type="button"
        aria-label="Add a network"
        title="Add a network"
        className="grid size-12 place-items-center rounded-2xl bg-muted text-emerald-500 transition hover:rounded-xl hover:bg-emerald-500 hover:text-white"
        onClick={onCreateNetwork}
      >
        <Plus className="size-6" />
      </button>
      <button
        type="button"
        aria-label="Explore networks"
        title="Explore networks"
        className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground transition hover:rounded-xl hover:bg-primary hover:text-primary-foreground"
      >
        <Compass className="size-6" />
      </button>
    </aside>
  );
}
