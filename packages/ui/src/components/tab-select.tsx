"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";

type TabSelectProps = {
  tabs: string[];
  activeTab?: string;
  setActiveTab?:
    | React.Dispatch<React.SetStateAction<string>>
    | ((tab: string) => void);
  className?: string;
  tabClassName?: string;
  gap?: string | number;
};

export const TabSelect = ({
  tabs,
  activeTab: propActiveTab,
  setActiveTab,
  className,
  tabClassName,
  gap = "2rem",
}: TabSelectProps) => {
  const [localActiveTab, setLocalActiveTab] = useState(tabs[0]);
  const activeTab = propActiveTab ?? localActiveTab;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const idx = tabs.indexOf(activeTab as string);
    const activeBtn = tabButtonRefs.current[idx];

    if (container && activeBtn) {
      const { offsetLeft, offsetWidth } = activeBtn;
      const containerWidth = container.offsetWidth;
      if (containerWidth === 0) return;

      const leftPercent = (offsetLeft / containerWidth) * 100;
      const rightPercent =
        100 - ((offsetLeft + offsetWidth) / containerWidth) * 100;

      container.style.clipPath = `inset(0% ${rightPercent.toFixed(2)}% 0% ${leftPercent.toFixed(2)}% round 12px)`;
    }
  }, [activeTab, tabs]);

  const handleClick = (tab: string) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div className="relative flex w-fit flex-col items-center">
      <div
        className="relative flex w-full flex-wrap justify-center"
        style={{ gap }}
      >
        {tabs.map((tab, idx) => (
          <div key={tab} className="flex items-center">
            <button
              ref={(el) => {
                tabButtonRefs.current[idx] = el;
              }}
              data-tab={tab}
              onClick={() => handleClick(tab)}
              className={cn(
                "flex items-center justify-center px-4 py-2 text-center text-sm font-semibold transition-colors",
                activeTab === tab
                  ? "text-neutral-950 dark:text-neutral-100"
                  : "dark:text-neutral-400",
                className,
                tabClassName
              )}
              type="button"
            >
              {tab}
            </button>
          </div>
        ))}
      </div>

      <div
        aria-hidden="true"
        ref={containerRef}
        style={{
          position: "absolute",
          zIndex: 0,
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          overflow: "hidden",
          transition: "clip-path 0.25s ease",
          pointerEvents: "none",
        }}
      >
        <div
          className="relative flex w-full flex-wrap justify-center bg-accent"
          style={{ gap }}
        >
          {tabs.map((tab) => (
            <div key={tab} className="flex items-center">
              <button
                tabIndex={-1}
                aria-hidden="true"
                className={cn(
                  "flex items-center justify-center px-4 py-2 text-center text-sm font-semibold text-neutral-100",
                  className,
                  tabClassName
                )}
                type="button"
                style={{
                  pointerEvents: "none",
                  background: "transparent",
                }}
              >
                {tab}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
