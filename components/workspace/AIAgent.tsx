"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Send,
  Sparkles,
  Palette,
  Layers,
  Loader2,
  FileDiff,
  CheckCircle2,
  Wifi,
  WifiOff,
  ShieldAlert,
  ShieldOff,
  Lock,
  UserRound,
} from "lucide-react";
import type {
  AIChatMessage,
  AIProposedChange,
  CapabilityMap,
  Project,
  UserRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ACCENT_COLORS, DESIGN_STYLES } from "@/lib/generator/tokens";
import { ROLE_LABELS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { DesignStyle } from "@/lib/types";

const CHIP_LABELS: Record<string, string> = {
  generation: "Generation",
  frontend: "Frontend",
  backend: "Backend",
  api: "APIs",
  database: "Database",
  auth: "Auth",
  ai_agent: "AI Agent",
  code_editor: "Code editor",
  terminal: "Terminal",
  packages: "Packages",
  zip_export: "ZIP export",
  deployment: "Deployment",
  user_management: "User mgmt",
};

interface AIAgentProps {
  project: Project;
  selectedPath: string | null;
  selectedContent: string;
  permissions: CapabilityMap;
  canAi: boolean;
  agentEnabled: boolean;
  agentInstructions: string;
  agentModel: string;
  userName: string;
  role: UserRole;
  profileName: string;
  onAiEnabledChange: (enabled: boolean) => void;
  onApplyChanges: (changes: AIProposedChange[]) => void;
  onQuickColor: (color: string) => void;
  onQuickDesign: (design: DesignStyle) => void;
  onLog: (text: string) => void;
}

export function AIAgent({
  project,
  selectedPath,
  selectedContent,
  permissions,
  canAi,
  agentEnabled,
  agentInstructions,
  agentModel,
  userName,
  role,
  profileName,
  onAiEnabledChange,
  onApplyChanges,
  onQuickColor,
  onQuickDesign,
}: AIAgentProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<AIProposedChange[]>([]);
  const [chatError, setChatError] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const aiBlocked = !canAi || !agentEnabled || !project.aiEnabled;
  const blockedReason = !canAi
    ? "The AI Agent is disabled for your account. Your permissions do not include AI agent access. Please contact the Master Admin."
    : !agentEnabled
      ? "The AI Agent is currently disabled by the Master Admin. Please try again later."
      : "AI chat is disabled for this project. An admin can re-enable it in Settings.";

  const quickActionsAllowed = permissions.frontend && permissions.generation;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing, pendingChanges]);

  const send = async () => {
    const text = input.trim();
    if (!text || typing || aiBlocked) return;
    setInput("");
    setChatError("");
    setPendingChanges([]);

    const history: AIChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setTyping(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          history: history.slice(0, -1),
          selectedPath,
          selectedContent,
          permissions,
          role,
          userName,
          profileName,
          agentInstructions,
          agentModel,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `The AI request failed: ${data.error}` },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "Request processed." },
      ]);
      setPendingChanges(data.changes ?? []);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `The AI request failed. ${
            err instanceof Error ? err.message : "Network error"
          }`,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const applyChanges = () => {
    if (pendingChanges.length === 0) return;
    onApplyChanges(pendingChanges);
    setPendingChanges([]);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        content: `Applied ${pendingChanges.length} proposed file change${pendingChanges.length > 1 ? "s" : ""}. Review the files and save when you're happy.`,
      },
    ]);
  };

  const quickColor = (color: string) => {
    setColorOpen(false);
    onQuickColor(color);
  };

  const quickDesign = (design: DesignStyle) => {
    onQuickDesign(design);
  };

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="panel-header justify-between">
        <span className="flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-accent" />
          AI Agent
        </span>
        <span className="flex items-center gap-1 text-[10px] normal-case tracking-normal text-dim">
          {canAi && agentEnabled && project.aiEnabled ? (
            <>
              <Wifi className="h-3 w-3 text-ok" /> available
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-faint" /> disabled
            </>
          )}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 code-scroll">
        <div className="mb-3 rounded-lg border border-line bg-panel-2/50 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
            <UserRound className="h-3 w-3" />
            {userName} · {ROLE_LABELS[role]}
            {profileName ? <span className="font-normal text-faint">— {profileName}</span> : null}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-dim">
            The agent only edits files relevant to your request and never deletes
            files. Proposed changes appear below for approval, and any change
            outside your permissions is blocked on the server.
          </p>
        </div>

        {!canAi ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-err/30 bg-err/10 p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-err/15">
              <ShieldOff className="h-5 w-5 text-err" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">Permission denied</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dim">{blockedReason}</p>
            </div>
          </div>
        ) : null}

        {canAi && !agentEnabled ? (
          <div className="mb-3 flex flex-col items-center gap-3 rounded-lg border border-warn/30 bg-warn/10 p-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn/15">
              <Lock className="h-5 w-5 text-warn" />
            </div>
            <div>
              <p className="text-xs font-semibold text-text">AI Agent disabled</p>
              <p className="mt-1 text-[11px] leading-relaxed text-dim">{blockedReason}</p>
            </div>
          </div>
        ) : null}

        {canAi && !project.aiEnabled ? (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[11px] text-warn">
            <Lock className="h-3 w-3 shrink-0" />
            AI chat is disabled for this project. An admin can re-enable it in
            Settings.
          </div>
        ) : null}

        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[92%] rounded-lg px-3 py-2 text-[12px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent text-accent-fg"
                    : "border border-line bg-panel-2/60 text-text"
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {typing ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel-2/60 px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                <span className="text-[12px] text-dim">Agent is working…</span>
              </div>
            </div>
          ) : null}
        </div>

        {pendingChanges.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 overflow-hidden rounded-lg border border-accent/40 bg-accent-soft"
          >
            <div className="flex items-center gap-2 border-b border-accent/20 px-3 py-2">
              <FileDiff className="h-3.5 w-3.5 text-accent" />
              <span className="text-[11px] font-semibold text-accent">
                Proposed changes ({pendingChanges.length}) — awaiting your approval
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto code-scroll">
              {pendingChanges.map((change, i) => (
                <div
                  key={i}
                  className="border-b border-accent/10 px-3 py-2 text-[11px] last:border-0"
                >
                  <p className="font-mono text-text">{change.path}</p>
                  <p className="mt-0.5 text-dim">{change.reason}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-3 py-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={applyChanges}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Apply changes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPendingChanges([])}>
                Dismiss
              </Button>
            </div>
          </motion.div>
        ) : null}

        {chatError ? (
          <p className="mt-3 rounded-md border border-err/30 bg-err/10 px-3 py-2 text-[11px] text-err">
            {chatError}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-dim">
            <ShieldAlert className="h-3 w-3 text-accent" />
            Permission-first agent
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-faint">Enable AI</span>
            <Switch
              checked={canAi && agentEnabled && project.aiEnabled}
              disabled={!canAi || !agentEnabled}
              onCheckedChange={onAiEnabledChange}
              aria-label="Enable AI Agent"
            />
          </div>
        </div>

        <p className="mb-2 flex flex-wrap items-center gap-1 text-[10px] leading-snug text-faint">
          <Sparkles className="h-3 w-3 text-accent" />
          Your capabilities:
          {(() => {
            const enabled = Object.entries(permissions).filter(([, v]) => v);
            return enabled.slice(0, 6).map(([key]) => (
              <span
                key={key}
                className="rounded-full border border-line bg-panel-2 px-1.5 py-0.5 font-medium text-dim"
              >
                {CHIP_LABELS[key] ?? key}
              </span>
            )).concat(
              enabled.length > 6
                ? [<span key="more" className="text-faint">+ {enabled.length - 6} more</span>]
                : []
            );
          })()}
        </p>

        {quickActionsAllowed ? (
          <>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setColorOpen((v) => !v)}
                className="flex items-center justify-center gap-1.5 rounded-md border border-line bg-panel-2/50 px-2 py-1.5 text-[11px] text-dim transition-colors hover:border-accent/40 hover:text-text"
              >
                <Palette className="h-3 w-3 text-accent" />
                Change colour
              </button>
              {(Object.keys(DESIGN_STYLES) as DesignStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => quickDesign(s)}
                  title={DESIGN_STYLES[s]}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] transition-colors",
                    project.info.design === s
                      ? "border-accent/50 bg-accent-soft text-accent"
                      : "border-line bg-panel-2/50 text-dim hover:text-text"
                  )}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {s}
                </button>
              ))}
            </div>

            {colorOpen ? (
              <div className="mt-2 rounded-lg border border-line bg-panel-2/50 p-2">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-faint">
                  <Palette className="h-3 w-3" />
                  Accent colour
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(ACCENT_COLORS).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => quickColor(key)}
                      title={key}
                      className="h-6 w-6 rounded-full border border-white/10 transition-transform hover:scale-110"
                      style={{ background: value.hex }}
                      aria-label={`Use colour ${key}`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-faint">
                  Regenerates the site styling with the selected accent.
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mb-2 rounded-md border border-line bg-panel-2/50 px-3 py-2 text-[11px] text-faint">
            Quick actions are unavailable — they regenerate the site and require
            frontend and generation permissions.
          </p>
        )}

        <div className="mt-3 flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              disabled={typing || aiBlocked}
              placeholder={
                aiBlocked
                  ? "AI Agent is unavailable for your account."
                  : "Ask the agent to change the generated website…"
              }
              className="w-full resize-none rounded-md border border-line-strong bg-panel-2 px-3 py-2 text-xs text-text placeholder:text-faint focus-visible:border-accent/60 focus-visible:outline-none disabled:opacity-50"
            />
          </div>
          <Button
            variant="primary"
            size="icon"
            onClick={send}
            disabled={!input.trim() || typing || aiBlocked}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
