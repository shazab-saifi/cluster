"use client";

import { ChevronDown, LogOut, Settings } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import type { Channel, NetworkListItem } from "./types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, leaveNetwork } from "./api";
import { getNetworkList } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NetworkManageDialog } from "./network-manage/network-manage-dialog";

type ActiveNetworkMenuProps = {
  activeNetwork?: NetworkListItem;
  channels: Channel[];
};

export function ActiveNetworkMenu({
  activeNetwork,
  channels,
}: ActiveNetworkMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isManageNetworkOpen, setIsManageNetworkOpen] = useState(false);

  const openMenu = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    if (!activeNetwork) {
      const set = () => setIsOpen(false);
      set();
    }
  }, [activeNetwork]);

  const leaveNetworkMutation = useMutation({
    mutationFn: leaveNetwork,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["network", activeNetwork?.id],
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });

      const refreshedMe = await queryClient.fetchQuery({
        queryKey: ["me"],
        queryFn: getMe,
      });
      const remainingNetworks = getNetworkList(refreshedMe.userData).filter(
        (network) => network.id !== activeNetwork?.id
      );

      toast.success("Left network.");

      const nextNetwork = remainingNetworks[0];
      router.replace(nextNetwork ? `/networks/${nextNetwork.id}` : "/friends");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false);
          return;
        }
        if (!activeNetwork) return;
        openMenu();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span className="flex w-fit items-center gap-2 text-left text-base font-semibold tracking-tight">
          <span className="min-w-0 truncate">
            {activeNetwork?.name ?? "Network"}
          </span>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-all",
              isOpen && "rotate-180 text-foreground"
            )}
          />
        </span>
      </DropdownMenuTrigger>
      {activeNetwork && (
        <DropdownMenuContent className="translate-x-5">
          {activeNetwork.role !== "MEMBER" && (
            <DropdownMenuItem onSelect={() => setIsManageNetworkOpen(true)}>
              <Settings />
              Manage Network
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => leaveNetworkMutation.mutate(activeNetwork.id)}
            disabled={leaveNetworkMutation.isPending}
          >
            <LogOut />
            {leaveNetworkMutation.isPending ? "Leaving..." : "Leave network"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
      <NetworkManageDialog
        network={{ ...activeNetwork, channels } as any}
        currentUserRole={activeNetwork?.role}
        open={isManageNetworkOpen}
        onOpenChange={setIsManageNetworkOpen}
      />
    </DropdownMenu>
  );
}
