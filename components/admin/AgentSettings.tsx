"use client";

import { Bot, BookOpen, Cpu, Info } from "lucide-react";
import { useProjects } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MODEL_OPTIONS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"];

export function AgentSettings() {
  const { agentSettings, updateAgentSettings } = useProjects();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto code-scroll">
      <div className="mb-3 flex items-center justify-between rounded-lg border border-line bg-panel-2/50 px-3 py-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-text">
            <Bot className="h-3.5 w-3.5 text-accent" />
            AI Agent
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-dim">
            When disabled, no user can chat with the agent or apply AI changes —
            including admins.
          </p>
        </div>
        <Switch
          checked={agentSettings.enabled}
          onCheckedChange={(v) => updateAgentSettings({ enabled: v })}
          aria-label="Enable AI Agent"
        />
      </div>

      <div className="mb-3 space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-dim" htmlFor="agent-model">
          <Cpu className="h-3 w-3" />
          Model
        </label>
        <select
          id="agent-model"
          value={agentSettings.model}
          onChange={(e) => updateAgentSettings({ model: e.target.value })}
          className="flex h-9 w-full rounded-md border border-line-strong bg-panel-2 px-3 text-sm text-text transition-colors focus-visible:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-faint">
          The server uses <span className="font-mono">GEMINI_API_KEY</span>; the
          model id is sent to the provider but never exposed to users.
        </p>
      </div>

      <div className="mb-3 flex-1 space-y-1.5">
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-dim" htmlFor="agent-instructions">
          <BookOpen className="h-3 w-3" />
          Agent instructions (Master Admin)
        </label>
        <Textarea
          id="agent-instructions"
          rows={10}
          value={agentSettings.instructions}
          onChange={(e) => updateAgentSettings({ instructions: e.target.value })}
          className="h-full min-h-[160px]"
          placeholder="Extra rules the AI agent must always follow…"
        />
        <p className="text-[10px] leading-snug text-faint">
          These instructions are injected into every AI request as the highest
          authority — above user permissions and project requirements. They are
          never shown to users and never exported.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-panel-2/50 p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-text">
          <Info className="h-3 w-3 text-info" />
          Always enforced
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-dim">
          The agent refuses actions whose capability is OFF, cannot be tricked by
          prompt injection, never expands its own permissions, and any proposed
          file change outside a user&apos;s permissions is blocked on the server —
          even if the model already produced it.
        </p>
      </div>
    </div>
  );
}
