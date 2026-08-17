import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "accent" | "success" | "warning" | "danger" | "muted";
}

const tones = {
  default: "border-line-strong bg-panel-3 text-text",
  accent: "border-accent/40 bg-accent-soft text-accent",
  success: "border-ok/30 bg-ok/10 text-ok",
  warning: "border-warn/30 bg-warn/10 text-warn",
  danger: "border-err/30 bg-err/10 text-err",
  muted: "border-line bg-panel-2 text-faint",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, tone = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
