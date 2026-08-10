"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ActiveNow } from "./active-now";
import { AddMemberDialog } from "./add-member/add-member-dialog";
import { getMe, getNetworkDetails } from "./api";
import { CreateChannelDialog } from "./create-channel/create-channel-dialog";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import NetworkStrip from "./network-strip";
import { getNetworkList } from "./utils";
import { ChatSection } from "./chat-section/chat-section";

type DashboardProps = {
  networkId: string;
};

export function Dashboard({ networkId }: DashboardProps) {
  const router = useRouter();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false);
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = React.useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [activeChannelId, setActiveChannelId] = React.useState<string>();
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const user = data?.userData;
  const networks = React.useMemo(() => getNetworkList(user), [user]);
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
  const channels = React.useMemo(
    () => networkDetails?.channels ?? [],
    [networkDetails?.channels]
  );
  const activeChannel = channels.find(
    (channel) => channel.id === activeChannelId
  );

  React.useEffect(() => {
    const set = () => setActiveChannelId(undefined);
    set();
  }, [networkId]);

  React.useEffect(() => {
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
      <NetworkStrip
        networks={networks}
        activeNetwork={selectedNetwork}
        isLoading={isLoading}
        onCreateNetwork={() => setIsCreateNetworkOpen(true)}
      />
      <DashboardSidebar
        activeNetwork={selectedNetwork}
        channels={channels}
        isChannelsLoading={isNetworkDetailsLoading}
        hasChannelsError={Boolean(networkDetailsError)}
        user={user}
        sessionUser={session?.user}
        onAddMember={() => setIsAddMemberOpen(true)}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onCreateNetwork={() => setIsCreateNetworkOpen(true)}
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
            <ChatSection channelId={activeChannel.id} />
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
      <CreateNetworkDialog
        open={isCreateNetworkOpen}
        onOpenChange={setIsCreateNetworkOpen}
      />
      <CreateChannelDialog
        network={selectedNetwork}
        open={isCreateChannelOpen}
        onOpenChange={setIsCreateChannelOpen}
      />
      <AddMemberDialog
        network={selectedNetwork}
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
      />
    </main>
  );
}
