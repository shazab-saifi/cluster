"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@workspace/ui/lib/utils";
import React from "react";

const themeOptions = [
  {
    value: "light",
    label: "Light theme",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: Moon,
  },
  {
    value: "system",
    label: "System theme",
    icon: Monitor,
  },
] as const;

function ThemeToggleComponent() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const activeTheme = mounted ? (theme ?? "system") : "system";

  useEffect(() => {
    const set = () => setMounted(true);
    set();
  }, []);

  return (
    <div
      className="relative flex w-fit items-center rounded-full border border-border bg-transparent"
      role="group"
      aria-label="Theme"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeTheme === option.value;

        return (
          <button
            key={option.value}
            data-tab={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "relative isolate flex cursor-pointer items-center justify-center rounded-full px-2 py-1 text-muted-foreground transition-colors hover:text-foreground",
              isActive && "text-(--text-primary)"
            )}
            type="button"
            aria-label={option.label}
            aria-pressed={isActive}
          >
            {isActive ? (
              <motion.span
                layoutId="theme-toggle-active-indicator"
                className="absolute inset-0 z-0 rounded-full bg-neutral-200 dark:bg-secondary"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            ) : null}
            <Icon className="relative z-10 size-4" />
          </button>
        );
      })}
    </div>
  );
}

export const ThemeToggle = React.memo(ThemeToggleComponent);
