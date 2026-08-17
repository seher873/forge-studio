"use client";

import {
  CheckCircle2,
  AlertTriangle,
  Circle,
  Bot,
  ShieldCheck,
  UserRound,
  Crown,
  Eye,
} from "lucide-react";
import type { PlatformUser, Project, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  project: Project;
  selectedFile: string | null;
  generationCount: number;
  aiAvailable: boolean;
  user?: PlatformUser;
  profileName: string;
}

const ROLE_ICONS: Record<UserRole, typeof Crown> = {
  MASTER_ADMIN: Crown,
  ADMIN: ShieldCheck,
  USER: UserRound,
  CLIENT: Eye,
};

export function StatusBar({
  project,
  selectedFile,
  generationCount,
  aiAvailable,
  user,
  profileName,
}: StatusBarProps) {
  const hasFiles = Object.keys(project.files).length > 0;
  const RoleIcon = ROLE_ICONS[user?.role ?? "USER"];
  const isMaster = user?.role === "MASTER_ADMIN";

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-accent-soft px-3 text-[11px] text-accent">
      <span className="flex items-center gap-1.5">
        {project.status === "generated" ? (
          <CheckCircle2 className="h-3 w-3 text-ok" />
        ) : project.status === "failed" ? (
          <AlertTriangle className="h-3 w-3 text-err" />
        ) : (
          <Circle className="h-3 w-3" />
        )}
        {hasFiles ? "Website generated" : "Project created — awaiting generation"}
      </span>
      <span className="ml-auto flex items-center gap-3">
        {selectedFile ? (
          <span className="hidden font-mono sm:inline">{selectedFile}</span>
        ) : null}
        <span className="hidden items-center gap-1 sm:inline-flex">
          <Bot className="h-3 w-3" />
          AI {aiAvailable ? "connected" : "offline"}
        </span>
        <span
          className={cn(
            "hidden items-center gap-1 md:inline-flex",
            isMaster ? "text-warn" : ""
          )}
          title={`${ROLE_LABELS[user?.role ?? "USER"]} · ${profileName || "no profile"}`}
        >
          <RoleIcon className="h-3 w-3" />
          {user?.name ?? "Unknown"} — {ROLE_LABELS[user?.role ?? "USER"]}
        </span>
        <span className="hidden font-mono tabular lg:inline">
          {project.info.mode === "full-stack"
            ? "full-stack"
            : project.info.mode === "custom"
              ? "custom"
              : "frontend"}
        </span>
        <span className="font-mono tabular">UTF-8</span>
        <span className="hidden font-mono tabular sm:inline">
          {generationCount > 0 ? `${generationCount} files` : "0 files"}
        </span>
      </span>
    </footer>
  );
}
