"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ActiveNow } from "./active-now";
import { getMe, getNetworkDetails } from "./api";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import NetworkStrip from "./network-strip";
import { ChatPanel } from "./chat-panel/chat-panel";
import { useEffect, useMemo, useState } from "react";
import { getNetworkList } from "@/lib/utils";

export function Dashboard({ networkId }: { networkId: string }) {
  const router = useRouter();
  const [activeChannelId, setActiveChannelId] = useState<string>();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const user = data?.userData;
  const networks = useMemo(() => getNetworkList(user), [user]);
  const selectedNetwork = networks.find((network) => network.id === networkId);
  const {
    data: networkDetails,
    isLoading: isNetworkDetailsLoading,
    error: networkDetailsError,
  } = useQuery({
    queryKey: ["network", networkId],
    queryFn: () => getNetworkDetails(networkId),
    enabled: Boolean(networkId),
  });
  const channels = useMemo(
    () => networkDetails?.channels ?? [],
    [networkDetails?.channels]
  );
  const activeChannel = channels.find(
    (channel) => channel.id === activeChannelId
  );

  useEffect(() => {
    const set = () => setActiveChannelId(undefined);
    set();
  }, [networkId]);

  useEffect(() => {
    if (isNetworkDetailsLoading || networkDetailsError) return;

    const set = () =>
      setActiveChannelId((currentChannelId) => {
        if (
          currentChannelId &&
          channels.some((channel) => channel.id === currentChannelId)
        ) {
          return currentChannelId;
        }

        return channels[0]?.id;
      });

    set();
  }, [channels, isNetworkDetailsLoading, networkDetailsError]);

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      console.error(error);
      return;
    }

    router.replace("/signin");
    router.refresh();
  };

  return (
    <main className="flex h-svh overflow-hidden bg-background text-foreground">
      <NetworkStrip networks={networks} isLoading={isLoading} />
      <DashboardSidebar
        activeNetwork={selectedNetwork}
        channels={channels}
        isChannelsLoading={isNetworkDetailsLoading}
        hasChannelsError={Boolean(networkDetailsError)}
        user={user}
        setIsChatOpen={setActiveChannelId}
        activeChannelId={activeChannel?.id}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          variant="network"
          activeChannelName={activeChannel?.name}
          onSignOut={handleSignOut}
        />
        <div className="flex min-h-0 flex-1">
          {activeChannel ? (
            <ChatPanel channelId={activeChannel.id} />
          ) : (
            <section className="flex min-w-0 flex-1 items-center justify-center p-6">
              <p className="text-center text-sm text-muted-foreground">
                {isNetworkDetailsLoading
                  ? "Loading channels"
                  : networkDetailsError
                    ? "Channels unavailable"
                    : "No channels yet"}
              </p>
            </section>
          )}
          <ActiveNow activeNetwork={selectedNetwork} />
        </div>
      </section>
    </main>
  );
}
