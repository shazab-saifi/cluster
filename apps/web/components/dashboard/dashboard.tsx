"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { ActiveNow } from "./active-now";
import { AddMemberDialog } from "./add-member/add-member-dialog";
import { getMe, getNetworkDetails } from "./api";
import { CreateChannelDialog } from "./create-channel/create-channel-dialog";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { FriendsPanel } from "./friends-panel";
import { NetworkStrip } from "./network-strip";
import { getNetworkList } from "./utils";

export function Dashboard() {
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false);
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = React.useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [activeNetworkId, setActiveNetworkId] = React.useState<string>();
  const { data: session } = authClient.useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const user = data?.userData;
  const networks = React.useMemo(() => getNetworkList(user), [user]);
  const activeNetwork = networks.find(
    (network) => network.id === activeNetworkId
  );
  const selectedNetwork = activeNetwork ?? networks[0];
  const {
    data: networkDetails,
    isLoading: isNetworkDetailsLoading,
    error: networkDetailsError,
  } = useQuery({
    queryKey: ["network", selectedNetwork?.id],
    queryFn: () => getNetworkDetails(selectedNetwork?.id ?? ""),
    enabled: Boolean(selectedNetwork?.id),
  });

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <main className="flex h-svh overflow-hidden bg-background text-foreground">
      <NetworkStrip
        networks={networks}
        activeNetwork={selectedNetwork}
        isLoading={isLoading}
        onSelectNetwork={(network) => setActiveNetworkId(network.id)}
        onCreateNetwork={() => setIsCreateNetworkOpen(true)}
      />
      <DashboardSidebar
        activeNetwork={selectedNetwork}
        channels={networkDetails?.channels ?? []}
        isChannelsLoading={isNetworkDetailsLoading}
        hasChannelsError={Boolean(networkDetailsError)}
        user={user}
        sessionUser={session?.user}
        onAddMember={() => setIsAddMemberOpen(true)}
        onCreateChannel={() => setIsCreateChannelOpen(true)}
        onCreateNetwork={() => setIsCreateNetworkOpen(true)}
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onSignOut={handleSignOut} />
        <div className="flex min-h-0 flex-1">
          <FriendsPanel
            user={user}
            networks={networks}
            isLoading={isLoading}
            hasError={Boolean(error)}
          />
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
