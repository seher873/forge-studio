"use client";

import { useMemo } from "react";
import { KeyRound, RotateCcw, ShieldCheck, UserCog } from "lucide-react";
import { useProjects } from "@/lib/store";
import {
  CAPABILITIES,
  findProfile,
  resolveUserPermissions,
  ROLE_LABELS,
} from "@/lib/permissions";
import type { PlatformUser, UserRole } from "@/lib/types";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PermissionRow } from "@/components/admin/PermissionRow";
import { Badge } from "@/components/ui/badge";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "MASTER_ADMIN", label: "Master Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "USER", label: "User" },
  { value: "CLIENT", label: "Client" },
];

interface PermissionManagerProps {
  user: PlatformUser;
}

export function PermissionManager({ user }: PermissionManagerProps) {
  const { profiles, updateUser } = useProjects();
  const profile = findProfile(profiles, user.profileId);
  const effective = resolveUserPermissions(user, profiles);
  const isMaster = user.role === "MASTER_ADMIN";

  const enabledCount = useMemo(
    () => CAPABILITIES.filter((cap) => effective[cap]).length,
    [effective]
  );

  const setOverride = (cap: (typeof CAPABILITIES)[number], value: boolean) => {
    updateUser(user.id, {
      overrides: { ...user.overrides, [cap]: value },
    });
  };

  const resetOverride = (cap: (typeof CAPABILITIES)[number]) => {
    const overrides = { ...user.overrides };
    delete overrides[cap];
    updateUser(user.id, { overrides });
  };

  const resetAll = () => updateUser(user.id, { overrides: {} });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto code-scroll">
      <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-line bg-panel-2/50 p-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-text">
              <UserCog className="h-4 w-4 text-accent" />
              {user.name}
            </p>
            <Badge tone={user.role === "MASTER_ADMIN" ? "warning" : "accent"}>
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-faint">
            @{user.username} · {enabledCount} of {CAPABILITIES.length} capabilities enabled
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 shrink-0 text-ok" />
      </div>

      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-dim" htmlFor="perm-role">
              Role
            </label>
            <Select
              id="perm-role"
              value={user.role}
              onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-dim" htmlFor="perm-profile">
              Permission profile
            </label>
            <Select
              id="perm-profile"
              value={user.profileId}
              disabled={isMaster}
              onChange={(e) => updateUser(user.id, { profileId: e.target.value })}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-[10px] text-faint">
          <KeyRound className="h-3 w-3 shrink-0" />
          {isMaster
            ? "Master Admin bypasses user-level permissions and has every capability enabled."
            : `Base permissions come from the "${profile?.name ?? "No profile"}" profile. Toggle any row to add a per-user override.`}
        </p>

        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Effective permissions
          </p>
          {Object.keys(user.overrides).length > 0 && !isMaster ? (
            <Button variant="ghost" size="xs" onClick={resetAll}>
              <RotateCcw className="h-3 w-3" />
              Reset all
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel-2/30">
        {CAPABILITIES.map((cap) => (
          <PermissionRow
            key={cap}
            capability={cap}
            checked={effective[cap]}
            disabled={isMaster}
            overridden={!isMaster && cap in user.overrides}
            onChange={(v) => setOverride(cap, v)}
            onReset={() => resetOverride(cap)}
          />
        ))}
      </div>

      <p className="mt-2 px-1 text-[10px] leading-snug text-faint">
        Changes are saved and enforced immediately — including in the AI agent and
        the terminal — for every request this user makes.
      </p>
    </div>
  );
}
