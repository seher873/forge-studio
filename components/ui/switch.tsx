import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <button
      ref={ref}
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        checked ? "border-accent bg-accent" : "border-line-strong bg-panel-3",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 rounded-full shadow-sm transition-transform",
          checked ? "translate-x-[18px] bg-white" : "translate-x-[3px] bg-dim"
        )}
      />
    </button>
  )
);
Switch.displayName = "Switch";
