"use client";

import { Search } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { XButton } from "@workspace/ui/components/x-button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounce } from "@workspace/ui/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { API_BASE_URL } from "@/lib/utils";

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
  const { debouncedValue } = useDebounce(query, 500);
  const { data, isPending, error, isError } = useQuery<SearchUserResult[]>({
    queryKey: ["seached username", debouncedValue],
    queryFn: async () => {
      const res = await axios.get<SearchUserResult[]>(
        `${API_BASE_URL}/user/search?q=${debouncedValue}`,
        {
          withCredentials: true,
        }
      );
      return res.data;
    },
  });

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-1">
          <h2
            id="search-user-title"
            className="text-base font-semibold text-foreground"
          >
            Add Friends
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            You can send friend request to people using their username
          </p>
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
        ) : isPending ? (
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
          data?.map((user) => (
            <div
              key={user.id}
              className="flex w-full items-center justify-between gap-4 rounded-xl border-b border-border px-2 py-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative size-8 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.image}
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/friends-search/online-badge.svg"
                    alt=""
                    className="absolute top-0 left-6 size-2"
                  />
                </div>
                <span className="min-w-0 truncate text-sm font-medium text-foreground">
                  {user.username}
                </span>
              </div>

              <Button type="button">Send Friend Request</Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

function SearchUserSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="flex w-full items-center justify-between gap-4 rounded-xl border-b border-border px-2 py-4"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="relative size-8 shrink-0">
              <Skeleton className="size-8 rounded-full" />
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
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-user-title"
        className="flex h-140 w-full max-w-180 flex-col rounded-lg border bg-card p-5 shadow-xl"
      >
        <div className="mb-2 flex justify-end">
          <XButton onClick={() => onOpenChange(false)} />
        </div>
        <SearchUser />
      </section>
    </div>
  );
}

export default SearchUser;
