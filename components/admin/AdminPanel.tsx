"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Layers, Bot, Hammer } from "lucide-react";
import { useProjects } from "@/lib/store";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { UserManagement } from "@/components/admin/UserManagement";
import { PermissionManager } from "@/components/admin/PermissionManager";
import { ProfilesAdmin } from "@/components/admin/ProfilesAdmin";
import { AgentSettings } from "@/components/admin/AgentSettings";
import { Badge } from "@/components/ui/badge";

type AdminTab = "users" | "profiles" | "agent";

const TABS: Array<{ key: AdminTab; label: string; icon: typeof Users }> = [
  { key: "users", label: "Users & permissions", icon: Users },
  { key: "profiles", label: "Permission profiles", icon: Layers },
  { key: "agent", label: "AI Agent", icon: Bot },
];

export function AdminPanel() {
  const router = useRouter();
  const { activeUser, users, profiles } = useProjects();
  const [tab, setTab] = useState<AdminTab>("users");
  const [selectedId, setSelectedId] = useState<string>(users[0]?.id ?? "seher");

  const selectedUser = users.find((u) => u.id === selectedId) ?? users[0];
  const profile = profiles.find((p) => p.id === selectedUser?.profileId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-panel-2/60 px-4 py-3">
        <button
          onClick={() => router.push("/")}
          className="rounded p-1.5 text-faint transition-colors hover:bg-panel-3 hover:text-text"
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15">
          <Hammer className="h-4 w-4 text-accent" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">Admin settings</p>
          <Badge tone="warning">{ROLE_LABELS[activeUser?.role ?? "USER"]}</Badge>
        </div>
      </div>

      <div className="flex shrink-0 gap-1 border-b border-line px-3 pt-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-md border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                tab === t.key
                  ? "border-accent text-text"
                  : "border-transparent text-dim hover:text-text"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 gap-4 p-4">
        {tab === "users" ? (
          <>
            <aside className="flex w-full flex-col overflow-hidden lg:w-[300px] lg:shrink-0">
              <UserManagement selectedId={selectedId} onSelect={setSelectedId} />
            </aside>
            <div className="hidden min-w-0 flex-1 flex-col overflow-hidden lg:flex">
              {selectedUser ? <PermissionManager user={selectedUser} /> : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden lg:hidden">
              {selectedUser ? <PermissionManager user={selectedUser} /> : null}
            </div>
          </>
        ) : null}

        {tab === "profiles" ? (
          <div className="w-full">
            <ProfilesAdmin />
          </div>
        ) : null}

        {tab === "agent" ? (
          <div className="w-full max-w-2xl">
            <AgentSettings />
          </div>
        ) : null}
      </div>
    </div>
  );
}
