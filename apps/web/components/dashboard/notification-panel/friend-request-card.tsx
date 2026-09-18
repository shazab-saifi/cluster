"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { acceptFriendRequest } from "@/lib/api";
import { Button } from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { getInitials } from "@workspace/ui/lib/utils";
import type { NotificationEvent } from "../types";

export function FriendRequestCard({
  notification,
}: {
  notification: NotificationEvent;
}) {
  const queryClient = useQueryClient();
  const actor = notification.actor;
  const friendshipId = notification.entityId ?? notification.actorId;
  const name = actor?.name ?? actor?.username ?? "Unknown member";
  const mutualFriends = notification.data?.mutualFriends ?? 0;

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pending-friend-requests"] });
      toast.success(`You are now friends with ${name}.`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isAccepted = acceptMutation.isSuccess;
  const isPending = acceptMutation.isPending;

  return (
    <div className="flex w-full items-center gap-3 px-4 py-3">
      <Avatar size="lg" className="shrink-0">
        {actor?.image ? <AvatarImage src={actor.image} alt="" /> : null}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {actor?.username ? (
          <p className="truncate text-xs text-muted-foreground">
            {actor.username}
          </p>
        ) : null}
        {mutualFriends > 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            {mutualFriends} mutual {mutualFriends === 1 ? "friend" : "friends"}
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        size="sm"
        onClick={() => acceptMutation.mutate()}
        disabled={isAccepted || isPending}
      >
        {isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : isAccepted ? (
          <Check className="size-3.5" />
        ) : null}
        {isAccepted ? "Accepted" : "Accept"}
      </Button>
    </div>
  );
}
