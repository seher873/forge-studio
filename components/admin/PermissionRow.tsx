"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Capability } from "@/lib/types";
import { CAPABILITY_META } from "@/lib/permissions";

interface PermissionRowProps {
  capability: Capability;
  checked: boolean;
  onChange: (checked: boolean) => void;
  overridden?: boolean;
  disabled?: boolean;
  onReset?: () => void;
}

export function PermissionRow({
  capability,
  checked,
  onChange,
  overridden,
  disabled,
  onReset,
}: PermissionRowProps) {
  const meta = CAPABILITY_META[capability];

  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-xs font-medium text-text">{meta.label}</p>
          {overridden ? (
            <button
              onClick={onReset}
              className="rounded-full border border-line bg-panel-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-warn transition-colors hover:border-warn/40"
              title="Reset to profile value"
            >
              override
            </button>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-faint">
          {meta.description}
        </p>
      </div>
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-wider",
          checked ? "text-ok" : "text-faint"
        )}
      >
        {checked ? "On" : "Off"}
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          disabled={disabled}
          aria-label={`${meta.label} permission`}
        />
      </span>
    </div>
  );
}
