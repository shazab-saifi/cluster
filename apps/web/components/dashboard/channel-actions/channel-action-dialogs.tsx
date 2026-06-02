"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import type { Channel } from "../types";
import { deleteChannel } from "./api";
import { EditChannelForm } from "./edit-channel-form";

type ChannelDialogProps = {
  channel?: Channel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditChannelDialog({
  channel,
  open,
  onOpenChange,
}: ChannelDialogProps) {
  useDialogEscape(open, onOpenChange);

  if (!open || !channel) return null;

  return (
    <DialogFrame
      titleId="edit-channel-title"
      onDismiss={() => onOpenChange(false)}
    >
      <DialogHeader
        titleId="edit-channel-title"
        title="Edit channel"
        description={`Rename #${channel.name}.`}
        onClose={() => onOpenChange(false)}
      />
      <EditChannelForm
        channel={channel}
        onCancel={() => onOpenChange(false)}
        onUpdated={() => onOpenChange(false)}
      />
    </DialogFrame>
  );
}

export function DeleteChannelDialog({
  channel,
  open,
  onOpenChange,
}: ChannelDialogProps) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteChannel,
    onSuccess: async () => {
      if (channel) {
        await queryClient.invalidateQueries({
          queryKey: ["network", channel.networkId],
        });
      }
      onOpenChange(false);
    },
  });

  useDialogEscape(open && !mutation.isPending, onOpenChange);

  if (!open || !channel) return null;

  return (
    <DialogFrame
      titleId="delete-channel-title"
      onDismiss={() => {
        if (!mutation.isPending) onOpenChange(false);
      }}
    >
      <DialogHeader
        titleId="delete-channel-title"
        title="Delete channel"
        description={`You are about to delete #${channel.name}.`}
        onClose={() => onOpenChange(false)}
        closeDisabled={mutation.isPending}
      />

      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          This channel will be deleted permanently along with all of its data,
          including messages and images.
        </p>

        {mutation.error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mutation.error.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => {
              mutation.mutate({
                networkId: channel.networkId,
                channelId: channel.id,
              });
            }}
          >
            {mutation.isPending ? "Deleting" : "Delete Channel"}
          </Button>
        </div>
      </div>
    </DialogFrame>
  );
}

function DialogFrame({
  titleId,
  onDismiss,
  children,
}: {
  titleId: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border bg-card p-5 shadow-xl"
      >
        {children}
      </section>
    </div>
  );
}

function DialogHeader({
  titleId,
  title,
  description,
  onClose,
  closeDisabled = false,
}: {
  titleId: string;
  title: string;
  description: string;
  onClose: () => void;
  closeDisabled?: boolean;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Close"
        onClick={onClose}
        disabled={closeDisabled}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function useDialogEscape(open: boolean, onOpenChange: (open: boolean) => void) {
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
}
