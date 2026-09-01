"use client";

import * as React from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { NetworkListItem } from "./types";

type ActiveNetworkMenuProps = {
  activeNetwork?: NetworkListItem;
  isLeaving: boolean;
  onLeave: () => void;
};

export function ActiveNetworkMenu({
  activeNetwork,
  isLeaving,
  onLeave,
}: ActiveNetworkMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<number | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimeout();
    setIsOpen(true);
  };

  const closeMenu = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      closeTimeoutRef.current = null;
    }, 120);
  };

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!activeNetwork) {
      const set = () => setIsOpen(false);
      set();
    }
  }, [activeNetwork]);

  return (
    <div
      className="relative"
      onMouseEnter={activeNetwork ? openMenu : undefined}
      onMouseLeave={activeNetwork ? closeMenu : undefined}
      onFocus={activeNetwork ? openMenu : undefined}
      onBlur={activeNetwork ? closeMenu : undefined}
    >
      <button
        type="button"
        className="flex w-fit items-center gap-2 text-left text-base font-semibold tracking-tight"
      >
        <span className="min-w-0 truncate">
          {activeNetwork?.name ?? "Network"}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-all",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>
      {activeNetwork && isOpen ? (
        <div
          className="absolute top-full left-0 z-20 mt-2 min-w-44 rounded-lg border bg-card p-1 text-card-foreground shadow-xl"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenu}
        >
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-50"
            onClick={onLeave}
            disabled={isLeaving}
          >
            <LogOut className="size-4" />
            {isLeaving ? "Leaving..." : "Leave network"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
