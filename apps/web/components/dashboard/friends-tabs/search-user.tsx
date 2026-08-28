"use client";

import { Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { XButton } from "@workspace/ui/components/x-button";
import Link from "next/link";
import { useState } from "react";
import { useDebounce } from "@workspace/ui/hooks/useDebounce";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog";

type SearchUserResult = {
  id: string;
  image: string;
  username: string;
};

type SearchUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SearchUser = () => {
  const [query, setQuery] = useState("");
  const [sentToUserIds, setSentToUserIds] = useState<Set<string>>(new Set());
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const { debouncedValue } = useDebounce(query, 500);
  const { data, isLoading, error, isError } = useQuery<SearchUserResult[]>({
    queryKey: ["searched username", debouncedValue],
    queryFn: async ({ signal }) => {
      const res = await axios.get<SearchUserResult[]>(
        `${API_BASE_URL}/user/search?q=${debouncedValue.trim()}`,
        {
          withCredentials: true,
          signal,
        }
      );
      return res.data;
    },
    enabled: debouncedValue.trim().length > 0,
  });

  const sendFriendRequest = useMutation({
    mutationFn: (receiverId: string) =>
      axios.post(
        `${API_BASE_URL}/notifications`,
        {
          eventType: "NOTIFICATION",
          type: "FRIEND_REQUEST",
          senderId: currentUserId,
          receiverId,
        },
        { withCredentials: true }
      ),
    onSuccess: (_data, receiverId) => {
      setSentToUserIds((prev) => new Set(prev).add(receiverId));
      toast.success("Friend request sent.");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not send friend request."));
    },
  });

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-1">
          <DialogTitle>Add Friends</DialogTitle>
          <DialogDescription>
            You can send friend request to people using their username
          </DialogDescription>
        </div>

        <div className="flex w-full items-center justify-between rounded-xl border-2 border-border bg-background px-4 py-2 shadow-[0_0_8px_rgba(0,0,0,0.25)]">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Search className="pointer-events-none size-5 text-muted-foreground" />
            <Input
              aria-label="Search users by username"
              value={query}
              autoFocus
              placeholder="@username"
              onChange={(event) => setQuery(event.target.value)}
              className="border-none bg-transparent p-0 text-base font-medium text-foreground shadow-none focus-visible:border-transparent dark:bg-transparent dark:focus-visible:border-transparent"
            />
          </div>
          <XButton
            aria-label="Clear search"
            title="Clear search"
            onClick={() => setQuery("")}
          />
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col overflow-y-auto">
        {query.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-2 py-8">
            <p className="max-w-xs text-center text-sm font-medium text-muted-foreground">
              Don&apos;t know anyone? Discover communities through our networks
              page and connect to people
            </p>
            <Button asChild type="button">
              <Link href="/networks">Explore Networks</Link>
            </Button>
          </div>
        ) : isLoading ? (
          <SearchUserSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-2 py-8">
            <p className="text-center font-medium text-destructive">
              {error?.message}
            </p>
            <p className="text-center font-medium text-muted-foreground">
              Please try again later
            </p>
          </div>
        ) : data?.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm font-medium text-muted-foreground">
            No users found
          </p>
        ) : (
          data?.map((user) => {
            const isSent = sentToUserIds.has(user.id);
            const isPending =
              sendFriendRequest.isPending &&
              sendFriendRequest.variables === user.id;

            return (
              <div
                key={user.id}
                className="flex w-full items-center justify-between gap-4 rounded-xl border-b border-border px-2 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.image}
                    alt=""
                    className="size-10 rounded-full object-cover"
                  />
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {user.username}
                  </span>
                </div>

                <Button
                  type="button"
                  disabled={isSent || isPending}
                  onClick={() => sendFriendRequest.mutate(user.id)}
                >
                  {isSent ? "Request Sent" : "Send Friend Request"}
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (
    axios.isAxiosError<{ error?: { message?: string; suggestion?: string } }>(
      error
    )
  ) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.error?.suggestion ??
      fallback
    );
  }

  return fallback;
}

function SearchUserSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={idx}
          className="flex w-full items-center justify-between gap-4 rounded-xl border-b border-border px-2 py-4"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative size-8 shrink-0">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="absolute top-0 left-6 size-2 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      ))}
    </>
  );
}

export function SearchUserDialog({
  open,
  onOpenChange,
}: SearchUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-140 w-full max-w-180">
        <SearchUser />
      </DialogContent>
    </Dialog>
  );
}

export default SearchUser;
