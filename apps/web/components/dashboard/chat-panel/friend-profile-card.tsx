"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getFriendProfile, removeFriend } from "@/lib/api";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { getInitials } from "@workspace/ui/lib/utils";

export function FriendProfileCard({ friendshipId }: { friendshipId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["friend-profile", friendshipId],
    queryFn: () => getFriendProfile(friendshipId),
    meta: { requiresAuth: true },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFriend(friendshipId),
    onSuccess: () => {
      toast.success("Friend removed.");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      router.push("/friends");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 pt-4 pb-2">
        <Skeleton className="size-31 rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>
    );
  }

  if (isError || !data) return null;

  const { user, mutualNetworks } = data;
  const name = user.name ?? user.username ?? "Friend";
  const displayUsername = user.username ? user.username : null;

  return (
    <div className="flex flex-col items-center gap-5 px-6 pt-4 pb-2">
      <Avatar className="size-31">
        {user.image ? <AvatarImage src={user.image} alt={name} /> : null}
        <AvatarFallback className="text-3xl font-semibold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center gap-1">
        <p className="text-2xl font-semibold tracking-tight">{name}</p>
        {displayUsername ? (
          <p className="text-base font-medium text-muted-foreground">
            {displayUsername}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {mutualNetworks.length > 0 ? (
          <div className="flex items-center gap-4">
            <AvatarGroup>
              {mutualNetworks.slice(0, 3).map((network) => (
                <Avatar key={network.id}>
                  {network.image ? (
                    <AvatarImage src={network.image} alt={network.name} />
                  ) : null}
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(network.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <p className="text-base font-medium text-muted-foreground">
              {mutualNetworks.length} Mutual{" "}
              {mutualNetworks.length === 1 ? "server" : "servers"}
            </p>
          </div>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">
            No mutual network
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          disabled={removeMutation.isPending}
          onClick={() => removeMutation.mutate()}
        >
          {removeMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Remove Friend
        </Button>
      </div>
    </div>
  );
}
