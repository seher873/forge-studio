"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileCode2, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { relativeTime } from "@/lib/utils";
import { ACCENT_COLORS } from "@/lib/generator/tokens";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const accent = project.info.color
    ? ACCENT_COLORS[project.info.color]?.hex ?? project.info.color
    : ACCENT_COLORS.indigo.hex;
  const fileCount = Object.keys(project.files).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative panel overflow-hidden rounded-xl transition-colors hover:border-line-strong"
    >
      <button
        onClick={() => router.push(`/workspace/${project.id}`)}
        className="block w-full text-left"
      >
        <div className="flex items-start gap-3 px-4 pt-4 pr-12">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-heading text-base font-bold text-accent-fg"
            style={{ background: accent }}
          >
            {project.info.name.charAt(0).toUpperCase() || "P"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text group-hover:text-accent">
              {project.info.name}
            </p>
            <p className="text-[11px] capitalize text-faint">
              {project.info.industry}
            </p>
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <p className="line-clamp-2 text-xs leading-relaxed text-dim">
            {project.info.details}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-line bg-panel-2/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {fileCount > 0 ? (
              <Badge tone="success">
                <FileCode2 className="h-3 w-3" /> {fileCount} files
              </Badge>
            ) : (
              <Badge tone="muted">Not generated</Badge>
            )}
            <Badge tone="accent" className="capitalize">
              {project.info.mode === "full-stack"
                ? "Full stack"
                : project.info.mode === "custom"
                  ? "Custom"
                  : "Frontend"}
            </Badge>
            <span className="text-[11px] text-faint">
              Updated {relativeTime(project.updatedAt)}
            </span>
          </div>
        </div>
      </button>

      <button
        onClick={() => setConfirmOpen(true)}
        className="absolute right-3 top-4 rounded-md p-1.5 text-faint transition-colors hover:bg-err/10 hover:text-err"
        aria-label={`Delete ${project.info.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project"
        description={`Delete "${project.info.name}" and all of its generated files? This cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={() => {
          onDelete(project.id);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </motion.div>
  );
}
