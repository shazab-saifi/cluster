"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { cancelFriendRequest } from "@/lib/api";
import { getInitials } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import type { Friendship } from "../types";

export function OutgoingRequests({
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
        Loading outgoing requests
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No outgoing friend requests
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col divide-y rounded-lg border">
      {requests.map((friendship) => (
        <OutgoingRequestRow key={friendship.id} friendship={friendship} />
      ))}
    </div>
  );
}

function OutgoingRequestRow({ friendship }: { friendship: Friendship }) {
  const queryClient = useQueryClient();
  const receiver = friendship.receiver;
  const name = receiver?.name ?? receiver?.username ?? "Friend";

  const cancelMutation = useMutation({
    mutationFn: () => cancelFriendRequest(friendship.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoing-friend-requests"] });
      toast.success("Friend request cancelled.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex h-16 items-center gap-3 px-4">
      <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
        {receiver?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receiver.image} alt="" className="size-full object-cover" />
        ) : (
          getInitials(name)
        )}
      </div>
      <span className="min-w-0 truncate font-medium">{name}</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="ml-auto shrink-0"
        disabled={cancelMutation.isPending}
        onClick={() => cancelMutation.mutate()}
      >
        {cancelMutation.isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : null}
        Cancel
      </Button>
    </div>
  );
}
