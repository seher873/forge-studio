"use client";

import { Monitor, X, Save, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorTabsProps {
  tabs: string[];
  active: string;
  dirty: Record<string, boolean>;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onSave: () => void;
}

export function EditorTabs({ tabs, active, dirty, onSelect, onClose, onSave }: EditorTabsProps) {
  const anyDirty = Object.values(dirty).some(Boolean);

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-line bg-panel">
      <div className="flex min-w-0 flex-1 items-end overflow-x-auto code-scroll">
        {tabs.map((path) => {
          const isActive = active === path;
          const isDirty = !!dirty[path];
          const name = path.split("/").pop() ?? path;
          return (
            <div
              key={path}
              className={cn(
                "group flex h-9 max-w-[200px] shrink-0 items-center border-r border-line transition-colors",
                isActive
                  ? "border-t-2 border-t-accent bg-editor"
                  : "hover:bg-panel-2"
              )}
            >
              <button
                onClick={() => onSelect(path)}
                className="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-xs"
                title={path}
              >
                <span
                  className={cn(
                    "truncate font-mono",
                    isActive ? "text-text" : "text-dim"
                  )}
                >
                  {name}
                </span>
              </button>
              {isDirty ? (
                <span className="px-2">
                  <CircleDot className="h-3 w-3 text-warn" />
                </span>
              ) : (
                <button
                  onClick={() => onClose(path)}
                  className="mr-1.5 rounded p-0.5 text-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-panel-3 hover:text-text"
                  aria-label={`Close ${name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={() => onSelect("preview")}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 border-r border-line px-3 text-xs transition-colors",
            active === "preview"
              ? "border-t-2 border-t-accent bg-editor text-text"
              : "text-dim hover:bg-panel-2 hover:text-text"
          )}
        >
          <Monitor className="h-3.5 w-3.5 text-info" />
          Preview
        </button>
      </div>
      <div className="flex shrink-0 items-center border-l border-line px-2">
        <button
          onClick={onSave}
          disabled={!anyDirty}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            anyDirty
              ? "bg-accent text-accent-fg hover:bg-accent-strong"
              : "text-faint"
          )}
          title="Save all changes (Ctrl+S)"
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}
