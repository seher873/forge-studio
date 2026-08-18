"use client";

import { useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Lock,
  Globe,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewPanelProps {
  html: string;
  projectName: string;
}

export function PreviewPanel({ html, projectName }: PreviewPanelProps) {
  const [frameKey, setFrameKey] = useState(0);
  const [url] = useState(
    `http://localhost:3000/${encodeURIComponent(projectName.toLowerCase().replace(/\s+/g, "-"))}`
  );

  const openInNewTab = () => {
    const blob = new Blob([html], { type: "text/html" });
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, "_blank");
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
  };

  return (
    <div className="flex h-full flex-col bg-editor">
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-panel-2/70 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-err/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
        </div>
        <div className="mx-2 flex h-7 flex-1 items-center gap-2 rounded-md border border-line bg-editor px-3">
          <Lock className="h-3 w-3 shrink-0 text-ok" />
          <Globe className="h-3 w-3 shrink-0 text-faint" />
          <span className="truncate font-mono text-[11px] text-dim">{url}</span>
        </div>
        <button
          onClick={() => setFrameKey((k) => k + 1)}
          className="rounded p-1.5 text-faint transition-colors hover:bg-panel-3 hover:text-text"
          title="Reload preview"
          aria-label="Reload preview"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={openInNewTab}
          disabled={!html}
          className="rounded p-1.5 text-faint transition-colors hover:bg-panel-3 hover:text-text disabled:opacity-40"
          title="Open preview in a new tab"
          aria-label="Open preview in a new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className={cn("min-h-0 flex-1", html ? "" : "flex items-center justify-center")}>
        {html ? (
          <iframe
            key={frameKey}
            title="Generated website preview"
            className="h-full w-full border-0 bg-white"
            sandbox="allow-scripts allow-popups"
            srcDoc={html}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-panel-2">
              <Monitor className="h-7 w-7 text-faint" />
            </div>
            <p className="text-sm font-medium text-dim">No preview yet</p>
            <p className="max-w-xs text-xs leading-relaxed text-faint">
              Generate the website to build the project and see a live preview
              of the result here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
