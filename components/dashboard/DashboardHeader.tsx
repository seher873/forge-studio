"use client";

import Link from "next/link";
import { Hammer, Terminal } from "lucide-react";
import { useProjects } from "@/lib/store";

export function DashboardHeader() {
  const { activeUser } = useProjects();
  const isMasterAdmin = activeUser?.role === "MASTER_ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow">
            <Hammer className="h-4.5 w-4.5 text-accent-fg" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-semibold tracking-tight text-text">Forge Studio</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-faint">
              AI Development Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMasterAdmin ? (
            <Link
              href="/seher"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 text-xs font-medium text-dim transition-colors hover:border-accent/50 hover:text-accent"
            >
              <Terminal className="h-3.5 w-3.5" />
              Wrap
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
