"use client";

import { useState } from "react";
import { Plus, Trash2, Layers } from "lucide-react";
import { useProjects } from "@/lib/store";
import { CAPABILITIES, findProfile } from "@/lib/permissions";
import type { CapabilityMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PermissionRow } from "@/components/admin/PermissionRow";
import { Badge } from "@/components/ui/badge";

export function ProfilesAdmin() {
  const { profiles, users, addProfile, updateProfile, deleteProfile } = useProjects();
  const [selectedId, setSelectedId] = useState<string>(profiles[0]?.id ?? "");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  const selected = findProfile(profiles, selectedId);

  const profileInUse = (id: string) =>
    users.some((u) => u.profileId === id) || id === "seher";

  const startCreate = () => {
    const empty: Record<string, boolean> = {};
    for (const cap of CAPABILITIES) empty[cap] = false;
    setEnabled(empty);
    setName("");
    setDescription("");
    setCreating(true);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const capabilities = { ...(enabled as CapabilityMap) };
    const profile = addProfile({ name, description, capabilities });
    setSelectedId(profile.id);
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    if (profileInUse(id)) return;
    deleteProfile(id);
    if (selectedId === id) setSelectedId(profiles.find((p) => p.id !== id)?.id ?? "");
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
          Permission profiles ({profiles.length})
        </p>
        <Button variant="secondary" size="xs" onClick={startCreate} disabled={creating}>
          <Plus className="h-3 w-3" />
          New profile
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5 code-scroll lg:max-w-[220px]">
          {profiles.map((profile) => {
            const onCount = CAPABILITIES.filter((c) => profile.capabilities[c]).length;
            const inUse = profileInUse(profile.id);
            return (
              <div
                key={profile.id}
                className={cn(
                  "rounded-lg border px-3 py-2.5 transition-colors",
                  selectedId === profile.id
                    ? "border-accent/50 bg-accent-soft"
                    : "border-line bg-panel-2/50 hover:border-line-strong"
                )}
              >
                <button
                  onClick={() => setSelectedId(profile.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
                      <Layers className="h-3.5 w-3.5 text-accent" />
                      {profile.name}
                    </p>
                    {profile.builtin ? (
                      <Badge tone="muted">built-in</Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-faint">
                    {profile.description}
                  </p>
                  <p className="mt-1 text-[10px] text-dim">
                    {onCount} of {CAPABILITIES.length} on
                  </p>
                </button>
                {!profile.builtin && !inUse ? (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="mt-1 flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-faint transition-colors hover:text-err"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel-2/30">
          {creating ? (
            <div className="flex flex-1 flex-col">
              <div className="space-y-2 border-b border-line bg-panel-2/40 p-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Profile name, e.g. Marketing"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  rows={2}
                />
                <Button variant="primary" size="xs" onClick={handleCreate} disabled={!name.trim()}>
                  <Plus className="h-3 w-3" />
                  Create profile
                </Button>
              </div>
              <div className="flex-1 divide-y divide-line overflow-y-auto code-scroll">
                {CAPABILITIES.map((cap) => (
                  <PermissionRow
                    key={cap}
                    capability={cap}
                    checked={enabled[cap]}
                    onChange={(v) => setEnabled((prev) => ({ ...prev, [cap]: v }))}
                  />
                ))}
              </div>
            </div>
          ) : selected ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-line bg-panel-2/40 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{selected.name}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-faint">
                    {selected.description}
                  </p>
                </div>
                <Badge tone={selected.builtin ? "muted" : "accent"}>
                  {selected.builtin ? "built-in template" : "custom"}
                </Badge>
              </div>
              <div className="flex-1 divide-y divide-line overflow-y-auto code-scroll">
                {CAPABILITIES.map((cap) => (
                  <PermissionRow
                    key={cap}
                    capability={cap}
                    checked={selected.capabilities[cap]}
                    onChange={(v) =>
                      updateProfile(selected.id, {
                        capabilities: { ...selected.capabilities, [cap]: v },
                      })
                    }
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <p className="mt-2 px-1 text-[10px] leading-snug text-faint">
        A profile is a reusable permission template. Profiles in use by at least one
        user (or built-in templates) cannot be deleted. Users may further override
        individual rows, so profile edits do not necessarily change a user&apos;s
        effective permissions.
      </p>
    </div>
  );
}
