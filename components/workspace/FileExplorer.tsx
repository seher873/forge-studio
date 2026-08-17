"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  FileCode2,
  FileText,
  Braces,
  Palette,
  FileJson,
  Folder,
  FolderOpen,
  File,
  RefreshCw,
} from "lucide-react";
import type { GeneratedFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  files: Record<string, GeneratedFile>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  generating: boolean;
  fileCount: number;
}

interface TreeNode {
  name: string;
  path: string;
  type: "dir" | "file";
  children: TreeNode[];
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", type: "dir", children: [] };
  for (const path of paths) {
    const parts = path.split("/");
    let node = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path: acc, type: isFile ? "file" : "dir", children: [] };
        node.children.push(child);
      }
      node = child;
    });
  }
  const sortTree = (n: TreeNode) => {
    n.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    n.children.forEach(sortTree);
  };
  sortTree(root);
  return root;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "ts" || ext === "tsx") return <FileCode2 className="h-4 w-4 text-aux" />;
  if (ext === "css") return <Palette className="h-4 w-4 text-info" />;
  if (ext === "json") return <FileJson className="h-4 w-4 text-warn" />;
  if (ext === "md") return <FileText className="h-4 w-4 text-dim" />;
  if (ext === "js" || ext === "mjs") return <Braces className="h-4 w-4 text-ok" />;
  return <File className="h-4 w-4 text-faint" />;
}

export function FileExplorer({
  files,
  selectedPath,
  onSelect,
  generating,
  fileCount,
}: FileExplorerProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const tree = useMemo(
    () => buildTree(Object.keys(files).sort()),
    [files]
  );

  const toggle = (path: string) =>
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));

  const renderNode = (node: TreeNode, depth: number) => {
    if (node.type === "file") {
      const active = selectedPath === node.path;
      return (
        <button
          key={node.path}
          onClick={() => onSelect(node.path)}
          className={cn(
            "flex w-full items-center gap-1.5 py-[3px] pr-2 text-left font-mono text-[12px] transition-colors",
            active
              ? "bg-panel-3 text-text"
              : "text-dim hover:bg-panel-2 hover:text-text"
          )}
          style={{ paddingLeft: `${10 + depth * 14}px` }}
        >
          {fileIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </button>
      );
    }

    const isOpen = !collapsed[node.path];
    return (
      <div key={node.path}>
        <button
          onClick={() => toggle(node.path)}
          className="flex w-full items-center gap-1.5 py-[3px] pr-2 text-left text-[12px] font-medium text-dim transition-colors hover:text-text"
          style={{ paddingLeft: `${10 + depth * 14}px` }}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 text-faint transition-transform", isOpen && "rotate-90")}
          />
          {isOpen ? (
            <FolderOpen className="h-4 w-4 text-accent/70" />
          ) : (
            <Folder className="h-4 w-4 text-accent/70" />
          )}
          <span>{node.name}</span>
        </button>
        {isOpen ? node.children.map((c) => renderNode(c, depth + 1)) : null}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="panel-header justify-between">
        <span>Explorer</span>
        {generating ? (
          <RefreshCw className="h-3 w-3 animate-spin text-accent" />
        ) : null}
      </div>
      <div className="px-1.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-faint">
        {fileCount > 0 ? "PROJECT" : "PROJECT — no files yet"}
      </div>
      <div className="flex-1 overflow-auto py-1 code-scroll">
        {fileCount === 0 ? (
          <div className="px-4 py-3 text-[11px] leading-relaxed text-faint">
            No generated files yet. Click{" "}
            <span className="text-accent">Generate website</span> to create the
            project files.
          </div>
        ) : (
          tree.children.map((c) => renderNode(c, 0))
        )}
      </div>
    </div>
  );
}
