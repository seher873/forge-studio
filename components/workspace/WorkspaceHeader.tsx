"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Hammer,
  Play,
  Download,
  Loader2,
  Circle,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkspaceHeaderProps {
  project: Project;
  generating: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  downloading: boolean;
  canGenerate: boolean;
  canDownload: boolean;
}

export function WorkspaceHeader({
  project,
  generating,
  onGenerate,
  onDownload,
  downloading,
  canGenerate,
  canDownload,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const [dotsOpen, setDotsOpen] = useState(false);
  const hasFiles = Object.keys(project.files).length > 0;

  return (
    <header className="flex h-11 shrink-0 items-center justify-between border-b border-line bg-panel-2/60 px-2 sm:px-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="hidden items-center gap-1.5 md:flex">
          <span className="h-3 w-3 rounded-full bg-err/70" />
          <span className="h-3 w-3 rounded-full bg-warn/70" />
          <span className="h-3 w-3 rounded-full bg-ok/70" />
        </div>
        <button
          onClick={() => router.push("/")}
          className="rounded p-1.5 text-faint transition-colors hover:bg-panel-3 hover:text-text"
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15">
          <Hammer className="h-3.5 w-3.5 text-accent" />
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-text">
            {project.info.name}
          </span>
          <span className="hidden text-faint sm:inline">— AI Development Platform</span>
          <Badge tone={hasFiles ? "success" : "muted"} className="hidden sm:inline-flex">
            {hasFiles ? "Generated" : "New project"}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onGenerate}
          disabled={generating || !canGenerate}
          title={
            canGenerate
              ? undefined
              : "Website generation is disabled for your account."
          }
          className="hidden sm:inline-flex"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {generating ? "Generating…" : hasFiles ? "Regenerate" : "Generate website"}
        </Button>
        <Button
          size="sm"
          onClick={onDownload}
          disabled={downloading || !hasFiles || !canDownload}
          className="hidden sm:inline-flex"
          title={
            canDownload
              ? "Download the generated project as a ZIP file"
              : "ZIP export is disabled for your account."
          }
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          ZIP
        </Button>

        <div className="relative sm:hidden">
          <button
            onClick={() => setDotsOpen((v) => !v)}
            className="rounded p-1.5 text-faint hover:bg-panel-3 hover:text-text"
            aria-label="Actions"
          >
            <Circle className="h-4 w-4" />
          </button>
          {dotsOpen ? (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border border-line-strong bg-panel shadow-pop">
              <button
                onClick={() => {
                  onGenerate();
                  setDotsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-panel-2"
                disabled={generating || !canGenerate}
              >
                <Play className="h-3.5 w-3.5 text-accent" />
                {generating ? "Generating…" : hasFiles ? "Regenerate" : "Generate website"}
              </button>
              <button
                onClick={() => {
                  onDownload();
                  setDotsOpen(false);
                }}
                disabled={!hasFiles || downloading || !canDownload}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text hover:bg-panel-2 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5 text-accent" />
                Download ZIP
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
