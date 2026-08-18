"use client";

import {
  Info,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Trash2,
  Globe,
  Lock,
  ShieldAlert,
} from "lucide-react";
import type { Project } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ACCENT_COLORS } from "@/lib/generator/tokens";

interface SettingsPanelProps {
  project: Project;
  isAdmin: boolean;
  canGenerate: boolean;
  onAiEnabledChange: (enabled: boolean) => void;
  onRegenerate: () => void;
  onClearFiles: () => void;
}

export function SettingsPanel({
  project,
  isAdmin,
  canGenerate,
  onAiEnabledChange,
  onRegenerate,
  onClearFiles,
}: SettingsPanelProps) {
  const accent = project.info.color
    ? ACCENT_COLORS[project.info.color]?.hex ?? project.info.color
    : ACCENT_COLORS.indigo.hex;
  const fileCount = Object.keys(project.files).length;

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="panel-header">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          Settings
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 code-scroll">
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
            <Globe className="h-3 w-3" />
            Project
          </p>
          <div className="space-y-2 rounded-lg border border-line bg-panel-2/50 p-3 text-xs">
            <div>
              <p className="text-faint">Name</p>
              <p className="mt-0.5 font-medium text-text">{project.info.name}</p>
            </div>
            <div>
              <p className="text-faint">Industry</p>
              <p className="mt-0.5 capitalize text-text">{project.info.industry}</p>
            </div>
            <div>
              <p className="text-faint">Mode</p>
              <p className="mt-0.5 font-medium capitalize text-text">
                {project.info.mode === "full-stack"
                  ? "Full stack"
                  : project.info.mode === "custom"
                    ? "Custom"
                    : "Frontend only"}
              </p>
            </div>
            <div>
              <p className="text-faint">Accent colour</p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-white/10"
                  style={{ background: accent }}
                />
                <span className="font-mono text-text">{accent}</span>
              </div>
            </div>
            <div>
              <p className="text-faint">Generated files</p>
              <p className="mt-0.5 font-medium text-text">
                {fileCount > 0 ? `${fileCount} files` : "None yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            AI Agent
          </p>
          <div className="flex items-center justify-between rounded-lg border border-line bg-panel-2/50 px-3 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-text">
                Enable AI chat
                {!isAdmin ? (
                  <Lock className="h-3 w-3 text-warn" />
                ) : null}
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-dim">
                {isAdmin
                  ? "Admin control — when disabled the agent only offers offline quick actions."
                  : "This switch is reserved for admins. Your account controls AI access through permissions."}
              </p>
            </div>
            {isAdmin ? (
              <Switch
                checked={project.aiEnabled}
                onCheckedChange={onAiEnabledChange}
                aria-label="Enable AI chat"
              />
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                <ShieldAlert className="h-3 w-3" />
                admin only
              </span>
            )}
          </div>
          <div className="rounded-lg border border-line bg-panel-2/50 px-3 py-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-text">
              <KeyRound className="h-3.5 w-3.5 text-warn" />
              Server-side API key
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-dim">
              The AI Agent uses <span className="font-mono">GEMINI_API_KEY</span>{" "}
              from the server environment. The key never leaves the server and is
              never included in exported ZIP files.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
            Generation
          </p>
          <div className="space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={onRegenerate}
              disabled={!canGenerate}
              title={
                canGenerate
                  ? undefined
                  : "Website generation is disabled for your account."
              }
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate website
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="w-full"
              onClick={onClearFiles}
              disabled={fileCount === 0 || !canGenerate}
              title={
                canGenerate
                  ? undefined
                  : "Website generation is disabled for your account."
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear generated files
            </Button>
            <div className="rounded-lg border border-line bg-panel-2/50 p-3">
              <p className="flex items-center gap-1.5 text-[11px] text-dim">
                <Info className="h-3 w-3 shrink-0 text-info" />
                Regenerating replaces the generated code and requires your
                confirmation. Manually saved edits to generated files will be lost.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
