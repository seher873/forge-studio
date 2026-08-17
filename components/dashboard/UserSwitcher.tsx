"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Check,
  Settings2,
  Shield,
  UserRound,
  Crown,
  Eye,
} from "lucide-react";
import { useProjects } from "@/lib/store";
import { canUse, ROLE_LABELS } from "@/lib/permissions";
import type { PlatformUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<UserRole, typeof Crown> = {
  MASTER_ADMIN: Crown,
  ADMIN: Shield,
  USER: UserRound,
  CLIENT: Eye,
};

export function UserSwitcher() {
  const router = useRouter();
  const { users, activeUser, profiles, setActiveUser } = useProjects();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const adminAllowed = canUse(activeUser, profiles, "user_management");

  const switchUser = (user: PlatformUser) => {
    setActiveUser(user.id);
    setOpen(false);
  };

  const ActiveIcon = ROLE_ICONS[activeUser?.role ?? "USER"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 transition-colors hover:border-line-strong"
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Signed in as ${activeUser?.name ?? "Unknown"}`}
      >
        <ActiveIcon className={cn("h-3.5 w-3.5", activeUser?.role === "MASTER_ADMIN" ? "text-warn" : "text-accent")} />
        <span className="max-w-[90px] truncate text-xs font-medium text-text">
          {activeUser?.name ?? "Guest"}
        </span>
        <span className="hidden text-[10px] font-medium uppercase tracking-wider text-faint sm:inline">
          {ROLE_LABELS[activeUser?.role ?? "USER"]}
        </span>
        <ChevronDown className="h-3 w-3 text-faint" />
      </button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="absolute right-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-lg border border-line-strong bg-panel shadow-pop"
          role="menu"
        >
          <div className="border-b border-line px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-faint">
              Signed-in account
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-text">
              {activeUser?.name ?? "Guest"}
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto py-1 code-scroll">
            {users.map((user) => {
              const Icon = ROLE_ICONS[user.role];
              const isActive = user.id === activeUser?.id;
              return (
                <button
                  key={user.id}
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => switchUser(user)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text transition-colors hover:bg-panel-2"
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      user.role === "MASTER_ADMIN" ? "text-warn" : "text-accent"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{user.name}</span>
                    <span className="block truncate text-[10px] text-faint">
                      {ROLE_LABELS[user.role]} · @{user.username}
                    </span>
                  </span>
                  {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
                </button>
              );
            })}
          </div>
          {adminAllowed ? (
            <div className="border-t border-line p-1">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/admin");
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-text transition-colors hover:bg-accent-soft hover:text-accent"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Admin settings
              </button>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}
