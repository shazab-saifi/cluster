import { CompassIcon, PlusIcon } from "@phosphor-icons/react";
import type { NetworkListItem } from "./types";
import { NetworkAvatar } from "./network-avatar";
import Image from "next/image";
import Link from "next/link";

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
    <aside className="flex w-18 shrink-0 flex-col items-center gap-2 border-r bg-background px-3 py-3">
      <Link
        href="/friends"
        className="grid size-12 cursor-pointer place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm"
      >
        <Image src="/cluster-logo.svg" width={48} height={48} alt="logo" />
      </Link>
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
        className="grid size-12 place-items-center rounded-2xl bg-muted text-primary transition hover:rounded-xl hover:bg-primary hover:text-primary-foreground"
        onClick={onCreateNetwork}
      >
        <PlusIcon className="size-6" />
      </button>
      <button
        type="button"
        aria-label="Explore networks"
        title="Explore networks"
        className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground transition hover:rounded-xl hover:bg-primary hover:text-primary-foreground"
      >
        <CompassIcon className="size-6" />
      </button>
    </aside>
  );
}
