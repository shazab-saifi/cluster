"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@workspace/ui/components/button";

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
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open || !network) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-channel-title"
        className="w-full max-w-md rounded-lg border bg-card p-5 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="create-channel-title" className="text-lg font-semibold">
              Create a channel
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a focused conversation space inside {network.name}.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <CreateChannelForm
          networkId={network.id}
          onCancel={() => onOpenChange(false)}
          onCreated={() => onOpenChange(false)}
        />
      </section>
    </div>
  );
}
