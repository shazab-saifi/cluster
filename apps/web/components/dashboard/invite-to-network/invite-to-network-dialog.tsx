"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { NetworkListItem } from "../types";
import { InviteToNetworkForm } from "./invite-to-network-form";

type InviteToNetworkDialogProps = {
  network?: NetworkListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteToNetworkDialog({
  network,
  open,
  onOpenChange,
}: InviteToNetworkDialogProps) {
  if (!network) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {network.name}</DialogTitle>
          <DialogDescription>
            Create an invite link for {network.name}.
          </DialogDescription>
        </DialogHeader>
        <InviteToNetworkForm
          networkId={network.id}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
