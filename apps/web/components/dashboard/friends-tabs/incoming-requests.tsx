"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { acceptFriendRequest, cancelFriendRequest } from "@/lib/api";
import { getInitials } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import type { Friendship } from "../types";

export function IncomingRequests({
  requests,
  isLoading,
}: {
  requests: Friendship[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin" />
        Loading incoming requests
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No incoming friend requests
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col divide-y rounded-lg border">
      {requests.map((friendship) => (
        <IncomingRequestRow key={friendship.id} friendship={friendship} />
      ))}
    </div>
  );
}

function IncomingRequestRow({ friendship }: { friendship: Friendship }) {
  const queryClient = useQueryClient();
  const sender = friendship.sender;
  const name = sender?.name ?? sender?.username ?? "Friend";

  const acceptMutation = useMutation({
    mutationFn: () => acceptFriendRequest(friendship.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-friend-requests"] });
      toast.success(`You are now friends with ${name}.`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => cancelFriendRequest(friendship.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-friend-requests"] });
      toast.success("Friend request declined.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isSubmitting = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
        {sender?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sender.image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <span className="min-w-0 truncate font-medium">{name}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isSubmitting || acceptMutation.isSuccess}
          onClick={() => acceptMutation.mutate()}
        >
          {acceptMutation.isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : null}
          {acceptMutation.isSuccess ? "Accepted" : "Accept"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isSubmitting}
          onClick={() => declineMutation.mutate()}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
