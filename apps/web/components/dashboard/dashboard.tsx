"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import { ActiveNow } from "./active-now";
import { getMe } from "./api";
import { CreateNetworkDialog } from "./create-network/create-network-dialog";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";
import { FriendsPanel } from "./friends-panel";
import { NetworkStrip } from "./network-strip";
import { getNetworkList } from "./utils";

export function Dashboard() {
  const [isCreateNetworkOpen, setIsCreateNetworkOpen] = React.useState(false);
  const { data: session } = authClient.useSession();
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });

  const user = data?.userData;
  const networks = React.useMemo(() => getNetworkList(user), [user]);
  const activeNetwork = networks[0];

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <main className="flex h-svh overflow-hidden bg-background text-foreground">
      <NetworkStrip
        networks={networks}
        activeNetwork={activeNetwork}
        isLoading={isLoading}
        onCreateNetwork={() => setIsCreateNetworkOpen(true)}
      />
      <DashboardSidebar
        networks={networks}
        activeNetwork={activeNetwork}
        user={user}
        sessionUser={session?.user}
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
          <ActiveNow activeNetwork={activeNetwork} />
        </div>
      </section>
      <CreateNetworkDialog
        open={isCreateNetworkOpen}
        onOpenChange={setIsCreateNetworkOpen}
      />
    </main>
  );
}
