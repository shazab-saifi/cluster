"use client";

import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { DashboardUser, NetworkDetails } from "../types";
import {
  Dialog,
  DialogContent,
  DialogLayout,
  DialogMain,
  DialogSidebar,
  DialogSidebarNav,
  DialogSidebarTab,
  DialogSidebarTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { ProfileForm, type ProfileFormHandle } from "../profile-form";
import { NetworksContent, NetworkDetailsContent } from "./networks-content";
import { FriendsContent } from "./friends-content";
import { SettingsContent } from "./settings-content";
import { tabs, type TabId } from "./constants";

type UserDialogProps = {
  user?: DashboardUser;
  sessionUser?: {
    name?: string | null;
    image?: string | null;
  };
  trigger: React.ReactNode;
};

export function UserDialog({ user, trigger }: UserDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [open, setOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isProfileDirty, setIsProfileDirty] = useState(false);
  const [isNetworkDirty, setIsNetworkDirty] = useState(false);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(
    null
  );
  const profileFormRef = useRef<ProfileFormHandle>(null);
  const networkFormRef = useRef<React.ComponentRef<
    typeof NetworkDetailsContent
  > | null>(null);

  if (!user) return null;

  const selectedNetwork = selectedNetworkId
    ? (user.networks.find((network) => network.id === selectedNetworkId) as
        | NetworkDetails
        | undefined)
    : undefined;

  const isNetworkDetails = activeTab === "networks" && !!selectedNetwork;

  const activeLabel = isNetworkDetails
    ? "Network Settings"
    : tabs.find((tab) => tab.id === activeTab)?.label;

  const activeDescription = isNetworkDetails
    ? "Update your network details and manage channels."
    : activeTab === "account"
      ? "Review your public profile details."
      : "Content for this section will be added next.";

  const renderTabContent = () => {
    switch (activeTab) {
      case "networks":
        return isNetworkDetails && selectedNetwork ? (
          <NetworkDetailsContent
            network={selectedNetwork}
            ref={networkFormRef}
            onPendingChange={setIsMutating}
            onDirtyChange={setIsNetworkDirty}
          />
        ) : (
          <NetworksContent onManageNetwork={setSelectedNetworkId} />
        );
      case "friends":
        return <FriendsContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return (
          <ProfileForm
            user={user}
            ref={profileFormRef}
            onPendingChange={setIsMutating}
            onDirtyChange={setIsProfileDirty}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent
        className="w-[min(960px,calc(100%-2rem))] max-w-4xl gap-0 overflow-hidden p-0"
        showCloseButton
      >
        <DialogLayout>
          <DialogSidebar>
            <DialogSidebarTitle>Manage</DialogSidebarTitle>
            <DialogSidebarNav>
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <DialogSidebarTab
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="size-5" />
                    <span>{tab.label}</span>
                  </DialogSidebarTab>
                );
              })}
            </DialogSidebarNav>
          </DialogSidebar>

          <DialogMain>
            <div className="flex-1 space-y-4 pr-1">
              {isNetworkDetails && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMutating(false);
                    setIsNetworkDirty(false);
                    setSelectedNetworkId(null);
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="size-4" />
                  Back to networks
                </button>
              )}

              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {activeLabel}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeDescription}
                </p>
              </div>

              {renderTabContent()}
            </div>

            <div className="mt-8 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={
                  (activeTab !== "account" && !isNetworkDetails) ||
                  isMutating ||
                  (activeTab === "account" && !isProfileDirty) ||
                  (isNetworkDetails && !isNetworkDirty)
                }
                onClick={() => {
                  if (isNetworkDetails) {
                    networkFormRef.current?.submit();
                  } else {
                    profileFormRef.current?.submit();
                  }
                }}
              >
                {isMutating ? "Updating..." : "Update"}
              </Button>
            </div>
          </DialogMain>
        </DialogLayout>
      </DialogContent>
    </Dialog>
  );
}
