"use client";

import { motion } from "framer-motion";
import { ShieldOff, Hammer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/store";
import { canUse, ROLE_LABELS } from "@/lib/permissions";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const router = useRouter();
  const { activeUser, profiles } = useProjects();
  const allowed = canUse(activeUser, profiles, "user_management");

  if (!allowed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-err/30 bg-err/10">
            <ShieldOff className="h-7 w-7 text-err" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Permission denied</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-dim">
              User management is disabled for your current account
              ({ROLE_LABELS[activeUser?.role ?? "USER"]}). Please contact the
              Master Admin.
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push("/")}>
            <Hammer className="h-3.5 w-3.5" />
            Back to dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <AdminPanel />
    </div>
  );
}
