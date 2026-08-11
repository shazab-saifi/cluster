"use client";

import * as React from "react";
import { XButton } from "@workspace/ui/components/x-button";
import type { NetworkListItem } from "../types";
import { AddMemberForm } from "./add-member-form";

type AddMemberDialogProps = {
  network?: NetworkListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMemberDialog({
  network,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
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
        aria-labelledby="add-member-title"
        className="w-full max-w-md rounded-lg border bg-card p-5 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="add-member-title" className="text-lg font-semibold">
              Add member
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an invite link for {network.name}.
            </p>
          </div>
          <XButton onClick={() => onOpenChange(false)} />
        </div>

        <AddMemberForm
          networkId={network.id}
          onCancel={() => onOpenChange(false)}
        />
      </section>
    </div>
  );
}
