"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { CreateNetworkForm } from "./create-network-form";

type CreateNetworkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateNetworkDialog({
  open,
  onOpenChange,
}: CreateNetworkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Create a network</DialogTitle>
          <DialogDescription>
            Set up a shared space with a general channel.
          </DialogDescription>
        </DialogHeader>
        <CreateNetworkForm
          onCancel={() => onOpenChange(false)}
          onCreated={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
