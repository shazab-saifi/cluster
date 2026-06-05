"use client";

import { API_BASE_URL } from "@/lib/utils";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { TypographyH2 } from "@workspace/ui/components/typography";
import { Button } from "@workspace/ui/components/button";

type NetworkPreviewResponse = {
  network: {
    id: string;
    name: string;
    image: string | null;
    type?: "PUBLIC" | "PRIVATE";
    description?: string | null;
  } | null;
};

const MEMBER_COUNT_LABEL = "5k plus members";

const STATIC_CHANNELS = [
  {
    name: "general",
    description: "General channel for general communication among members",
  },
  {
    name: "announcements",
    description:
      "All major airbnb related announcements like a new feature on airbnb website",
  },
];

export const NetworkPreviewCard = ({
  token,
  isLoggedIn,
}: {
  token: string;
  isLoggedIn: boolean;
}) => {
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
      const res = await axios.get<NetworkPreviewResponse>(
        `${API_BASE_URL}/invites/${token}`
      );

      return res.data;
    },
    enabled: isLoggedIn,
  });

  const joinNetwork = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_BASE_URL}/invites/${token}`,
        {},
        {
          withCredentials: true,
        }
      );
    },
    onSuccess: () => router.push("/"),
  });

  if (isLoading) {
    return (
      <div className="flex w-full max-w-[48rem] flex-col items-center gap-8">
        <Card className="flex w-full flex-col items-center gap-4 rounded-[2rem] bg-card">
          <CardHeader className="mt-6.5 flex w-full flex-col items-center gap-4">
            <Skeleton className="mb-2 size-24 rounded-full" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-52" />
          </CardHeader>
          <CardContent className="mt-6 w-full space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="my-8 h-24 w-full" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col gap-2">
          <TypographyH2 className="text-center">Oops!</TypographyH2>
          <p>An error has occured, Please try again later.</p>
          <p>{error.message}</p>
        </div>
        <Button onClick={() => router.push("/")}>Go Back</Button>
      </div>
    );
  }

  const network = data?.network;
  const networkName = network?.name ?? "Network";
  const networkInitials = getInitials(networkName);
  const networkDescription = network?.description?.trim();

  return (
    <Card className="max-h-[calc(100svh-2.5rem)] w-full max-w-[48rem] overflow-y-auto rounded-[2rem] border-border/80 bg-card px-0 py-7 text-card-foreground shadow-2xl sm:py-10">
      <CardHeader className="items-center gap-5 px-6 text-center sm:px-12">
        <div className="grid size-28 place-items-center overflow-hidden rounded-full bg-[#ff385c] text-3xl font-semibold text-white sm:size-36">
          {network?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={network.image}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            networkInitials
          )}
        </div>

        <div className="space-y-5">
          <h1 className="text-3xl leading-tight font-semibold tracking-normal sm:text-4xl">
            {networkName}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-3 text-lg text-muted-foreground sm:text-2xl">
            <span>{MEMBER_COUNT_LABEL}</span>
            <div className="flex items-center -space-x-3">
              <span className="z-10 grid size-14 place-items-center rounded-full bg-black text-lg font-bold text-white ring-2 ring-card">
                +5k
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-pink-200 text-sm font-semibold text-pink-950 ring-2 ring-card">
                AD
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-cyan-200 text-sm font-semibold text-cyan-950 ring-2 ring-card">
                NL
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 px-6 pt-4 pb-0 sm:px-8">
        {networkDescription ? (
          <p className="mx-auto max-w-[40rem] text-center text-xl leading-relaxed text-foreground sm:text-3xl">
            {networkDescription}
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-xl font-medium text-muted-foreground sm:text-2xl">
            Active Channels
          </h2>

          <div className="space-y-4">
            {STATIC_CHANNELS.map((channel) => (
              <article
                key={channel.name}
                className="rounded-lg bg-black px-7 py-5 text-white"
              >
                <h3 className="text-2xl leading-tight font-semibold sm:text-3xl">
                  # {channel.name}
                </h3>
                {channel.description?.trim() ? (
                  <p className="mt-3 max-w-[38rem] text-lg leading-snug text-white/60 sm:text-2xl">
                    {channel.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <Button
          type="button"
          size="lg"
          className={cn(
            "mt-8 h-16 w-full rounded-xl bg-[#8b4dff] text-xl font-semibold text-white hover:bg-[#7c3dff] sm:text-3xl",
            joinNetwork.isPending && "opacity-80"
          )}
          disabled={joinNetwork.isPending}
          onClick={() => joinNetwork.mutate()}
        >
          {joinNetwork.isPending ? "Joining..." : "Join Network"}
        </Button>
      </CardContent>
    </Card>
  );
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
