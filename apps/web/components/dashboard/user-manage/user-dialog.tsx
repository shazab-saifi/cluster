"use client";

import { useRef, useState } from "react";
import type { DashboardUser } from "../types";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { SidebarNav } from "./sidebar-nav";
import { ProfileForm, type ProfileFormHandle } from "../profile-form";
import { NetworksContent } from "./networks-content";
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

export function UserDialog({ user, sessionUser, trigger }: UserDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [open, setOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const profileFormRef = useRef<ProfileFormHandle>(null);

  if (!user) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "networks":
        return <NetworksContent />;
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
        <div className="grid h-140 md:grid-cols-[220px_minmax(0,1fr)]">
          <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

          <section className="custom-scrollbar flex flex-col overflow-y-auto p-6">
            <div className="flex-1 space-y-4 pr-1">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "account"
                    ? "Review your public profile details."
                    : "Content for this section will be added next."}
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
                disabled={activeTab !== "account" || isMutating}
                onClick={() => profileFormRef.current?.submit()}
              >
                {isMutating ? "Updating..." : "Update"}
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
