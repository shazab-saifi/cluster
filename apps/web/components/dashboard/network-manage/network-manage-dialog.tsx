"use client";

import { useState } from "react";
import { HashIcon, UsersIcon } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogLayout,
  DialogMain,
  DialogSidebar,
  DialogSidebarNav,
  DialogSidebarTab,
  DialogSidebarTitle,
} from "@workspace/ui/components/dialog";
import { ChannelsContent } from "./channels-content";
import type { NetworkDetails } from "../types";

type TabId = "channels" | "members";

const tabs: { id: TabId; label: string; icon: typeof HashIcon }[] = [
  { id: "channels", label: "Channels", icon: HashIcon },
  { id: "members", label: "Members", icon: UsersIcon },
];

type NetworkManageDialogProps = {
  network?: NetworkDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NetworkManageDialog({
  network,
  open,
  onOpenChange,
}: NetworkManageDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("channels");

  const isChannels = activeTab === "channels";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(720px,calc(100%-2rem))] max-w-3xl gap-0 overflow-hidden p-0"
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
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {isChannels ? "Channels" : "Members"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isChannels
                    ? "Manage the channels in this network."
                    : "Manage the members of this network."}
                </p>
              </div>

              {isChannels ? (
                <ChannelsContent channels={network?.channels ?? []} />
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed bg-muted/10 p-6 text-sm text-muted-foreground">
                  Members management coming soon.
                </div>
              )}
            </div>
          </DialogMain>
        </DialogLayout>
      </DialogContent>
    </Dialog>
  );
}
