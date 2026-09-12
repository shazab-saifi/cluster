"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import type { NetworkListItem } from "../types";
import { CreateChannelForm } from "./create-channel-form";

type CreateChannelDialogProps = {
  network?: NetworkListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateChannelDialog({
  network,
  open,
  onOpenChange,
}: CreateChannelDialogProps) {
  if (!network) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Create a channel</DialogTitle>
          <DialogDescription>
            Add a focused conversation space inside {network.name}.
          </DialogDescription>
        </DialogHeader>
        <CreateChannelForm
          networkId={network.id}
          onCancel={() => onOpenChange(false)}
          onCreated={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
