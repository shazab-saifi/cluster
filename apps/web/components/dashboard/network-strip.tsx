"use client";

import React, { useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { CirclePlus, Compass } from "lucide-react";
import type { NetworkListItem } from "./types";
import { NetworkAvatar } from "./network-avatar";
import Image from "next/image";
import Link from "next/link";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";

type NetworkStripProps = {
  networks: NetworkListItem[];
  isLoading: boolean;
};

function NetworkStrip({ networks, isLoading }: NetworkStripProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isFriendsActive = pathname === "/friends";
  const [isTransitioning, startTransition] = useTransition();
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = useState(false);

  const routeNetworkId = pathname.startsWith("/networks/")
    ? pathname.split("/").pop()
    : undefined;

  const [visualNetworkId, setVisualNetworkId] = useState(routeNetworkId);

  useEffect(() => {
    const set = () => setVisualNetworkId(routeNetworkId);
    set();
  }, [routeNetworkId]);

  return (
    <aside className="flex flex-col items-end gap-4 border-r bg-background py-3 pr-4">
      <Link
        href="/friends"
        className="relative flex h-11 w-14 items-center justify-end"
      >
        {isFriendsActive ? (
          <motion.span
            layoutId="network-strip-active-indicator"
            className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-foreground will-change-transform"
            transition={{
              type: "spring",
              stiffness: 700,
              damping: 40,
              mass: 0.6,
            }}
          />
        ) : null}
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Image src="/cluster-logo.svg" width={48} height={48} alt="logo" />
        </span>
      </Link>
      <div className="flex min-h-0 flex-1 flex-col items-end gap-4 overflow-y-auto">
        {isLoading &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-14 animate-pulse rounded-xl bg-muted"
            />
          ))}
        {networks.map((network) => (
          <NetworkAvatar
            key={network.id}
            network={network}
            active={network.id === visualNetworkId}
            onClick={() => {
              setVisualNetworkId(network.id);
              startTransition(() => {
                router.push("/networks/" + network.id);
              });
            }}
          />
        ))}
        <button
          type="button"
          aria-label="Add a network"
          title="Add a network"
          className="group grid size-11 cursor-pointer place-items-center rounded-xl bg-secondary text-(--text-primary) transition-colors hover:bg-primary hover:text-primary-foreground"
          onClick={() => setIsCreateNetworkOpen(true)}
        >
          <CirclePlus
            fill="currentColor"
            className="size-8 stroke-secondary transition-colors group-hover:stroke-primary"
          />
        </button>
      </div>

      <button
        type="button"
        aria-label="Explore networks"
        title="Explore networks"
        className="group grid size-11 place-items-center rounded-xl bg-secondary text-(--text-primary) transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Compass
          fill="currentColor"
          className="size-8 stroke-secondary transition-colors group-hover:stroke-primary"
        />
      </button>
      <CreateNetworkDialog
        open={isCreateNetworkOpen}
        onOpenChange={setIsCreateNetworkOpen}
      />
    </aside>
  );
}

export default React.memo(NetworkStrip);
