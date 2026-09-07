"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";
import type { NetworkRole } from "../types";
import { getMe, leaveNetwork } from "../api";
import { getNetworkList } from "../utils";

const ROLE_BADGES: Record<Exclude<NetworkRole, "MEMBER">, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-secondary text-secondary-foreground",
  MODERATOR: "bg-muted text-muted-foreground",
};

const ROLE_LABELS: Record<Exclude<NetworkRole, "MEMBER">, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
};

export function NetworksContent() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
  const networks = getNetworkList(data?.userData);

  const leaveMutation = useMutation({
    mutationFn: leaveNetwork,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(result?.msg ?? "Left network.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-2">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
        Could not load your networks.
      </div>
    );
  }

  if (networks.length === 0) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
        No networks yet.
      </div>
    );
  }

  return (
    <div className="divide-y overflow-hidden rounded-xl border">
      {networks.map((network) => {
        const isLeader = network.role !== "MEMBER";

        return (
          <div
            key={network.id}
            className="flex min-h-16 items-center gap-3 px-3 transition hover:bg-muted/50"
          >
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground">
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
              <p className="truncate font-semibold text-foreground">
                {network.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {network.type.toLowerCase()} network
              </p>
            </div>

            {isLeader ? (
              <>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                    ROLE_BADGES[network.role as Exclude<NetworkRole, "MEMBER">]
                  }`}
                >
                  {ROLE_LABELS[network.role as Exclude<NetworkRole, "MEMBER">]}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </>
            ) : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={leaveMutation.isPending}
                onClick={() => leaveMutation.mutate(network.id)}
              >
                {leaveMutation.isPending &&
                leaveMutation.variables === network.id
                  ? "Leaving"
                  : "Leave"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
