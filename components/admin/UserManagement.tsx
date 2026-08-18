"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Trash2, Crown, Shield, User as UserIcon, Eye, FolderLock } from "lucide-react";
import { useProjects } from "@/lib/store";
import { findProfile, ROLE_LABELS } from "@/lib/permissions";
import type { PlatformUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: "MASTER_ADMIN", label: "Master Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "USER", label: "User" },
  { value: "CLIENT", label: "Client" },
];

const ROLE_ICONS: Record<UserRole, typeof Crown> = {
  MASTER_ADMIN: Crown,
  ADMIN: Shield,
  USER: UserIcon,
  CLIENT: Eye,
};

interface UserManagementProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function UserManagement({ selectedId, onSelect }: UserManagementProps) {
  const { users, profiles, addUser, deleteUser, activeUserId } = useProjects();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "custom");
  const [error, setError] = useState("");

  const startCreate = () => {
    setCreating(true);
    setError("");
  };

  const cancelCreate = () => {
    setCreating(false);
    setName("");
    setUsername("");
    setRole("USER");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError("That username is already taken.");
      return;
    }
    const user = addUser({ name, username, role, profileId });
    onSelect(user.id);
    cancelCreate();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Users ({users.length})
        </p>
        <Button variant="secondary" size="xs" onClick={startCreate} disabled={creating}>
          <UserPlus className="h-3 w-3" />
          New user
        </Button>
      </div>

      {creating ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-3 space-y-2 rounded-lg border border-accent/40 bg-accent-soft p-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-dim" htmlFor="new-name">
                Display name
              </label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ahmed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-dim" htmlFor="new-username">
                Username
              </label>
              <Input
                id="new-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. ahmed"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-dim" htmlFor="new-role">
                Role
              </label>
              <Select id="new-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-dim" htmlFor="new-profile">
                Permission profile
              </label>
              <Select
                id="new-profile"
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {error ? <p className="text-[11px] text-err">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="primary" size="xs" onClick={handleCreate}>
              <UserPlus className="h-3 w-3" />
              Create user
            </Button>
            <Button variant="ghost" size="xs" onClick={cancelCreate}>
              Cancel
            </Button>
          </div>
        </motion.div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 code-scroll">
        {users.map((user) => {
          const Icon = ROLE_ICONS[user.role];
          const profile = findProfile(profiles, user.profileId);
          const isActive = user.id === activeUserId;
          return (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              className={cn(
                "group w-full rounded-lg border px-3 py-2.5 text-left transition-colors",
                selectedId === user.id
                  ? "border-accent/50 bg-accent-soft"
                  : "border-line bg-panel-2/50 hover:border-line-strong"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      user.role === "MASTER_ADMIN" ? "bg-warn/15 text-warn" : "bg-panel-3 text-accent"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text">
                      {user.name}
                      {isActive ? (
                        <span className="ml-1.5 text-[9px] font-medium uppercase tracking-wider text-ok">
                          you
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[10px] text-faint">
                      {ROLE_LABELS[user.role]} · {profile?.name ?? "No profile"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className="hidden text-[9px] font-medium text-faint transition-opacity group-hover:opacity-100 sm:inline"
                  >
                    {Object.keys(user.overrides).length > 0
                      ? `${Object.keys(user.overrides).length} overrides`
                      : "inherits profile"}
                  </span>
                  {user.id !== "seher" ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteUser(user.id);
                        if (selectedId === user.id) onSelect("seher");
                      }}
                      className="rounded p-1 text-faint opacity-0 transition-all hover:bg-err/10 hover:text-err group-hover:opacity-100"
                      title="Delete user"
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
        <p className="flex items-center gap-1.5 px-1 pt-2 text-[10px] leading-snug text-faint">
          <FolderLock className="h-3 w-3 shrink-0" />
          Select a user to review and edit their effective permissions.
        </p>
      </div>
    </div>
  );
}
