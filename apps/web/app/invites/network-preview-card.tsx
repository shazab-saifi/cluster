"use client";

import { API_BASE_URL } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type NetworkPreviewResponse = {
  network: {
    id: string;
    name: string;
    image: string | null;
    desc: string | null;
    memberCount: number | null;
    members: Array<{ user: { image: string | null } }>;
    channels: Array<{ id: string; name: string }>;
  } | null;
};

export function NetworkPreviewCard({
  token,
  isLoggedIn,
}: {
  token: string;
  isLoggedIn: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push(
        `/signin?callbackUrl=${encodeURIComponent(`/invites/${token}`)}`
      );
    }
  }, [isLoggedIn, router, token]);

  const { data, isError, error, isLoading } = useQuery<NetworkPreviewResponse>({
    queryKey: ["network-preview", token],
    queryFn: async () => {
      const response = await axios.get<NetworkPreviewResponse>(
        `${API_BASE_URL}/invites/${token}`
      );
      return response.data;
    },
    enabled: isLoggedIn,
  });

  const joinNetwork = useMutation({
    mutationFn: () =>
      axios.post(
        `${API_BASE_URL}/invites/${token}`,
        {},
        { withCredentials: true }
      ),
    onSuccess: () => router.push("/"),
  });

  if (!isLoggedIn || isLoading) {
    return <NetworkPreviewSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex w-sm flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Oops!</h1>
          <p className="mt-2 text-muted-foreground">
            An error occurred. Please try again later.
          </p>
          <p className="mt-1 text-sm text-destructive">{error.message}</p>
        </div>
        <Button className="w-full" onClick={() => router.push("/")}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!data?.network) {
    return null;
  }

  const { network } = data;
  const remainingMemberCount = Math.max(
    (network.memberCount ?? 0) - network.members.length,
    0
  );

  return (
    <Card className="w-sm">
      <CardContent className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-18">
              <AvatarImage
                src={network.image ?? undefined}
                alt={network.name}
              />
              <AvatarFallback>{getInitials(network.name)}</AvatarFallback>
            </Avatar>
            <p className="text-center text-xl font-medium">{network.name}</p>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm text-neutral-400">
              Around {network.memberCount} community members
            </p>
            <AvatarGroup>
              {network.members.map((member, idx) => (
                <Avatar key={idx}>
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={`Community member ${idx + 1}`}
                  />
                  <AvatarFallback>M{idx + 1}</AvatarFallback>
                </Avatar>
              ))}
              {remainingMemberCount > 0 && (
                <AvatarGroupCount>
                  {formatMemberCount(remainingMemberCount)}
                </AvatarGroupCount>
              )}
            </AvatarGroup>
          </div>
        </div>

        {network.desc && (
          <p className="text-center text-neutral-100">{network.desc}</p>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-sm text-neutral-400">Active channels</span>
          {network.channels && (
            <div className="flex flex-wrap gap-2">
              {network.channels.map((channel, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-background px-4 py-2 font-medium"
                >
                  # {channel.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button onClick={() => joinNetwork.mutate()} className="w-full">
          Join Network
        </Button>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMemberCount(count: number) {
  if (count < 1_000) return `${count}+`;

  return `${Math.floor(count / 1_000)}k+`;
}

function NetworkPreviewSkeleton() {
  return (
    <div className="flex w-sm flex-col items-center gap-8">
      <Card className="flex w-full flex-col items-center gap-4 rounded-[2rem] bg-card">
        <CardHeader className="mt-6.5 flex w-full flex-col items-center gap-4">
          <Skeleton className="mb-2 size-24 rounded-full" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="mt-6 w-full space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="my-8 h-24 w-full" />
          <Skeleton className="h-8 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
