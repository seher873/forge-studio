"use client";

import { useEffect, useRef, useState } from "react";
import { TerminalSquare, ChevronRight, X, Lock } from "lucide-react";
import type { LogLine } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  lines: LogLine[];
  onCommand: (cmd: string) => void;
  open: boolean;
  onToggle: () => void;
  enabled: boolean;
  userName: string;
}

const levelClass: Record<LogLine["level"], string> = {
  info: "text-info",
  success: "text-ok",
  warn: "text-warn",
  error: "text-err",
  cmd: "text-aux",
};

export function TerminalPanel({
  lines,
  onCommand,
  open,
  onToggle,
  enabled,
  userName,
}: TerminalPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, open]);

  const submit = () => {
    const cmd = input.trim();
    if (!cmd) return;
    onCommand(cmd);
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="flex h-7 shrink-0 items-center gap-2 border-t border-line bg-panel px-3 text-[11px] font-medium text-faint transition-colors hover:text-text"
      >
        <TerminalSquare className={cn("h-3.5 w-3.5", enabled ? "text-ok" : "text-faint")} />
        Terminal
        <span className="ml-auto flex items-center gap-2">
          {enabled ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
              ready
            </>
          ) : (
            <>
              <Lock className="h-3 w-3 text-warn" />
              restricted
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </button>
    );
  }

  return (
    <div className="flex h-44 shrink-0 flex-col border-t border-line bg-[#0c1018]">
      <div className="panel-header justify-between bg-panel-2/50">
        <span className="flex items-center gap-2">
          <TerminalSquare className={cn("h-3.5 w-3.5", enabled ? "text-ok" : "text-faint")} />
          Terminal — output panel
          {!enabled ? (
            <span className="flex items-center gap-1 rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-[9px] font-medium text-warn">
              <Lock className="h-2.5 w-2.5" />
              access disabled
            </span>
          ) : null}
        </span>
        <button
          onClick={onToggle}
          className="rounded p-0.5 text-faint transition-colors hover:text-text"
          aria-label="Close terminal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-[1.7] code-scroll"
      >
        {lines.length === 0 ? (
          <p className="text-faint">
            Forge Studio terminal. Generation steps and agent activity appear here.
            {enabled ? (
              <>
                {" "}
                Type <span className="text-accent">help</span> to see available commands.
              </>
            ) : (
              <span className="text-warn">
                {" "}
                Command execution is disabled for your account.
              </span>
            )}
          </p>
        ) : (
          lines.map((line) => (
            <div key={line.id} className="flex gap-2 whitespace-pre-wrap">
              <span className="shrink-0 tabular text-faint">[{line.time}]</span>
              <span className={cn("shrink-0", levelClass[line.level])}>
                {line.level === "success" ? "✓" : line.level === "error" ? "✗" : "›"}
              </span>
              <span className="text-text/90">{line.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line px-3 py-1.5">
        <span className="text-ok">❯</span>
        <span className="shrink-0 font-mono text-[11px] text-accent">{userName}</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          disabled={!enabled}
          className="h-6 flex-1 bg-transparent font-mono text-[12px] text-text outline-none placeholder:text-faint disabled:cursor-not-allowed disabled:text-faint"
          placeholder={
            enabled
              ? "Enter a command (execution is restricted)…"
              : "Terminal access is disabled for your account."
          }
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}
