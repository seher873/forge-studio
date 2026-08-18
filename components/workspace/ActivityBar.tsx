"use client";

import { Files, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityKey = "files" | "ai" | "settings";

interface ActivityBarProps {
  active: ActivityKey;
  onSelect: (key: ActivityKey) => void;
}

const items: Array<{ key: ActivityKey; icon: typeof Files; label: string }> = [
  { key: "files", icon: Files, label: "Explorer" },
  { key: "ai", icon: Bot, label: "AI Agent" },
  { key: "settings", icon: Settings, label: "Settings" },
];

export function ActivityBar({ active, onSelect }: ActivityBarProps) {
  return (
    <div className="flex w-12 shrink-0 flex-col items-center border-r border-line bg-[#0b0f17] py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={cn(
              "relative mb-1 flex h-9 w-9 items-center justify-center rounded-md transition-colors",
              isActive ? "text-accent" : "text-faint hover:bg-panel-2 hover:text-text"
            )}
            title={item.label}
            aria-label={item.label}
            aria-pressed={isActive}
          >
            {isActive ? (
              <span className="absolute -left-[7px] h-5 w-0.5 rounded-full bg-accent" />
            ) : null}
            <Icon className="h-[18px] w-[18px]" />
          </button>
        );
      })}
    </div>
  );
}
