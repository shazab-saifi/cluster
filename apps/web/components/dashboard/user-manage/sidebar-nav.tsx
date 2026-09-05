"use client";

import { type TabId, tabs } from "./constants";

export function SidebarNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <aside className="overflow-y-auto border-b p-4 md:border-r md:border-b-0">
      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-secondary text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
