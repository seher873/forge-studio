"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  FileText,
  Folder,
  FolderOpen,
  Image as ImageIcon,
  Lock,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  ShieldOff,
  Terminal,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/lib/store";
import { Button } from "@/components/ui/button";

const KEY_STORAGE = "forge-wrap-key";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  modified: number;
  children?: FileEntry[];
}

function buildTree(files: FileEntry[]): FileEntry[] {
  const root: FileEntry[] = [];
  const map = new Map<string, FileEntry>();

  const sorted = [...files].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const f of sorted) {
    const node: FileEntry = { ...f };
    map.set(f.path, node);

    const parts = f.path.split("/");
    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  }
  return root;
}

function FileTree({ entries, level, onSelect, selected }: {
  entries: FileEntry[];
  level: number;
  onSelect: (path: string) => void;
  selected: string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const e of entries) {
      if (e.type === "dir") initial[e.path] = level < 1;
    }
    setExpanded((prev) => ({ ...initial, ...prev }));
  }, [entries, level]);

  return (
    <div>
      {entries.map((entry) => (
        <div key={entry.path}>
          <button
            onClick={() => {
              if (entry.type === "dir") {
                setExpanded((prev) => ({ ...prev, [entry.path]: !prev[entry.path] }));
              } else {
                onSelect(entry.path);
              }
            }}
            className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-[11px] transition-colors hover:bg-[#1a1a1a] ${
              selected === entry.path ? "bg-[#1a1a1a] text-[#00ff88]" : "text-[#777]"
            }`}
            style={{ paddingLeft: `${level * 12 + 4}px` }}
          >
            {entry.type === "dir" ? (
              <>
                {expanded[entry.path] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                {expanded[entry.path] ? <FolderOpen className="h-3 w-3 shrink-0 text-[#febc2e]" /> : <Folder className="h-3 w-3 shrink-0 text-[#febc2e]" />}
              </>
            ) : (
              <>
                <span className="w-3" />
                {entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? (
                  <ImageIcon className="h-3 w-3 shrink-0 text-[#6d8bff]" />
                ) : (
                  <FileText className="h-3 w-3 shrink-0 text-[#555]" />
                )}
              </>
            )}
            <span className="truncate">{entry.name}</span>
          </button>
          {entry.type === "dir" && expanded[entry.path] && entry.children && (
            <FileTree entries={entry.children} level={level + 1} onSelect={onSelect} selected={selected} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function WrapPage() {
  const { activeUser } = useProjects();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: string; content: string }[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [modelSearch, setModelSearch] = useState("");
  const [showModels, setShowModels] = useState(false);
  const [history, setHistory] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileSort, setFileSort] = useState<"recent" | "alpha">("recent");
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isMasterAdmin = activeUser?.role === "MASTER_ADMIN";

  useEffect(() => {
    setAccessKey(window.sessionStorage.getItem(KEY_STORAGE) ?? "");
    fetch("/api/wrap/models")
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelDropRef.current && !modelDropRef.current.contains(e.target as Node)) {
        setShowModels(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [history, result, error]);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`/api/wrap/files?sort=${fileSort}`);
      const data = await res.json();
      setFileTree(buildTree(data.files ?? []));
    } catch {}
  }, [fileSort]);

  useEffect(() => {
    if (showFiles) fetchFiles();
  }, [showFiles, fetchFiles]);

  const openFile = async (path: string) => {
    setSelectedFile(path);
    try {
      const res = await fetch(`/api/wrap/files/${path}`);
      const data = await res.json();
      setFileContent(data.content ?? null);
    } catch {
      setFileContent("Failed to load file.");
    }
  };

  const handleFiles = async (input: FileList | null) => {
    if (!input) return;
    const MAX = 512 * 1024;
    const added: typeof files = [];
    for (const f of Array.from(input)) {
      if (f.size > MAX) continue;
      const isImage = f.type.startsWith("image/");
      const isText = f.type.startsWith("text/") || /\.(ts|tsx|js|jsx|json|md|css|html|py|rb|go|rs|java|c|cpp|h|sh|yaml|yml|toml|env|sql|graphql|prisma)$/i.test(f.name);
      if (isText) {
        const text = await f.text();
        added.push({ name: f.name, type: "text", content: text });
      } else if (isImage) {
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        added.push({ name: f.name, type: "image", content: b64 });
      }
    }
    setFiles((prev) => [...prev, ...added]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && running) {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [running, cancel]);

  const run = async () => {
    if (!prompt.trim() || running) return;
    const userPrompt = prompt.trim();
    setRunning(true);
    setResult(null);
    setError(null);
    setHistory((h) => [...h, { role: "user", text: userPrompt }]);
    setPrompt("");

    let fullPrompt = userPrompt;
    if (files.length > 0) {
      const parts: string[] = [];
      for (const f of files) {
        if (f.type === "text") parts.push(`--- ${f.name} ---\n${f.content}`);
        else if (f.type === "image") parts.push(`--- ${f.name} (image) ---\n${f.content}`);
      }
      fullPrompt = parts.join("\n\n") + "\n\n" + userPrompt;
    }
    setFiles([]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/wrap", {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(accessKey ? { "x-wrap-key": accessKey } : {}),
        },
        body: JSON.stringify({ prompt: fullPrompt, model: model.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error ?? "Something went wrong.";
        setError(msg);
        setHistory((h) => [...h, { role: "agent", text: `[error] ${msg}` }]);
        if (res.status === 401 && accessKey) {
          window.sessionStorage.removeItem(KEY_STORAGE);
          setAccessKey("");
        }
        return;
      }

      if (accessKey) window.sessionStorage.setItem(KEY_STORAGE, accessKey);
      const code = data.code ?? "";
      setResult(code);
      setHistory((h) => [...h, { role: "agent", text: code }]);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Cancelled.");
        setHistory((h) => [...h, { role: "agent", text: "[cancelled]" }]);
      } else {
        setError("Could not reach the server.");
        setHistory((h) => [...h, { role: "agent", text: "[error] Could not reach the server." }]);
      }
    } finally {
      abortRef.current = null;
      setRunning(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!isMasterAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="font-mono text-sm text-[#ff3333]">ACCESS DENIED</p>
          <p className="mt-2 font-mono text-xs text-[#555]">This terminal is restricted to the operator.</p>
          <Link href="/" className="mt-4 inline-block font-mono text-xs text-[#00ff88] hover:underline">
            &lt;- return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a] text-[#b0b0b0] font-mono">
      {/* Terminal title bar */}
      <header className="flex items-center justify-between border-b border-[#1a1a1a] bg-[#0f0f0f] px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs text-[#555]">seher-agent — terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowFiles(!showFiles); if (!showFiles) fetchFiles(); }}
            className={`text-xs transition-colors ${showFiles ? "text-[#00ff88]" : "text-[#555] hover:text-[#00ff88]"}`}
          >
            {showFiles ? <PanelRightClose className="inline h-3.5 w-3.5" /> : <PanelRightOpen className="inline h-3.5 w-3.5" />}
            {" "}files
          </button>
          <Link href="/" className="text-xs text-[#555] transition-colors hover:text-[#00ff88]">
            &lt;- dashboard
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Terminal panel */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Terminal output */}
          <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4">
        {history.length === 0 && !running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-[#00ff88]">seher-agent v1.0</p>
            <p className="text-[#444]">Type your prompt and press Enter. Esc to cancel.</p>
            <p className="text-[#444]">Attach files with the clip icon below.</p>
            <p className="text-[#333]">─────────────────────────────────────────</p>
          </motion.div>
        )}

        {history.map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3"
          >
            {entry.role === "user" ? (
              <div className="flex gap-2">
                <span className="shrink-0 text-[#00ff88]">$</span>
                <span className="text-[#e0e0e0] whitespace-pre-wrap">{entry.text}</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <span className="shrink-0 text-[#6d8bff]">&gt;</span>
                <div className="min-w-0 flex-1">
                  <pre className="whitespace-pre-wrap break-words text-[#b0b0b0] text-xs leading-relaxed">{entry.text}</pre>
                  <button
                    onClick={() => copy(entry.text)}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#444] transition-colors hover:text-[#00ff88]"
                  >
                    {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                    {copied ? "copied" : "copy"}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {running && (
          <div className="flex gap-2 text-[#555]">
            <span className="shrink-0 text-[#febc2e]">~</span>
            <span className="animate-pulse">processing<span className="animate-[dots_1.5s_steps(4,end)_infinite]">...</span></span>
          </div>
        )}
        </div>
        </div>

        {/* File browser sidebar */}
        {showFiles && (
          <div className="flex h-full w-64 shrink-0 flex-col border-l border-[#1a1a1a] bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2">
              <span className="text-[11px] text-[#555]">FILES</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFileSort("recent")}
                  className={`text-[10px] transition-colors ${fileSort === "recent" ? "text-[#00ff88]" : "text-[#444] hover:text-[#777]"}`}
                >
                  recent
                </button>
                <button
                  onClick={() => setFileSort("alpha")}
                  className={`text-[10px] transition-colors ${fileSort === "alpha" ? "text-[#00ff88]" : "text-[#444] hover:text-[#777]"}`}
                >
                  A-Z
                </button>
                <button onClick={fetchFiles} className="text-[10px] text-[#444] hover:text-[#00ff88]">↻</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1">
              <FileTree entries={fileTree} level={0} onSelect={openFile} selected={selectedFile ?? ""} />
            </div>
          </div>
        )}

        {/* File preview panel */}
        {selectedFile && (
          <div className="flex h-full w-96 shrink-0 flex-col border-l border-[#1a1a1a] bg-[#0a0a0a]">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] px-3 py-2">
              <span className="truncate text-[11px] text-[#777]">{selectedFile}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { if (fileContent) navigator.clipboard.writeText(fileContent); }}
                  className="text-[10px] text-[#444] hover:text-[#00ff88]"
                >
                  <Copy className="h-3 w-3" />
                </button>
                <button onClick={() => { setSelectedFile(null); setFileContent(null); }} className="text-[#444] hover:text-[#ff5f57]">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-[11px] leading-relaxed text-[#999]">
              {fileContent ?? "Loading..."}
            </pre>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[#1a1a1a] bg-[#0f0f0f] px-4 py-3">
        {/* File chips */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-1.5 py-0.5 text-[10px] text-[#555]">
                {f.type === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
                {f.name}
                <button onClick={() => removeFile(i)} className="ml-0.5 hover:text-[#ff5f57]"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <span className="shrink-0 pb-2 text-sm text-[#00ff88]">$</span>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                run();
              }
            }}
            placeholder={running ? "waiting for response..." : "type your prompt..."}
            rows={2}
            disabled={running}
            className="flex-1 resize-none bg-transparent font-mono text-sm text-[#e0e0e0] placeholder:text-[#333] focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1.5 pb-1.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.sh,.yaml,.yml,.toml,.env,.sql,.graphql,.prisma,.txt,.png,.jpg,.jpeg,.gif,.webp"
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded p-1.5 text-[#444] transition-colors hover:bg-[#1a1a1a] hover:text-[#00ff88]"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Model selector */}
            <div ref={modelDropRef} className="relative">
              <button
                onClick={() => setShowModels(!showModels)}
                className="rounded p-1.5 text-[#444] transition-colors hover:bg-[#1a1a1a] hover:text-[#6d8bff]"
                title={model || "Select model"}
              >
                <Terminal className="h-4 w-4" />
              </button>
              {showModels && (
                <div className="absolute bottom-full right-0 mb-2 w-72 max-h-60 overflow-auto rounded border border-[#1a1a1a] bg-[#0f0f0f] shadow-xl">
                  <div className="sticky top-0 border-b border-[#1a1a1a] bg-[#0a0a0a] p-2">
                    <input
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="search models..."
                      autoFocus
                      className="w-full bg-transparent font-mono text-xs text-[#e0e0e0] placeholder:text-[#333] focus:outline-none"
                    />
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { setModel(""); setModelSearch(""); setShowModels(false); }}
                      className={`w-full rounded px-2 py-1 text-left text-[11px] transition-colors hover:bg-[#1a1a1a] ${!model ? "text-[#00ff88]" : "text-[#555]"}`}
                    >
                      default (server configured)
                    </button>
                    {models
                      .filter((m) => m.toLowerCase().includes(modelSearch.toLowerCase()))
                      .slice(0, 50)
                      .map((m) => (
                        <button
                          key={m}
                          onClick={() => { setModel(m); setModelSearch(""); setShowModels(false); }}
                          className={`w-full rounded px-2 py-1 text-left text-[11px] transition-colors hover:bg-[#1a1a1a] ${m === model ? "text-[#00ff88]" : "text-[#555]"}`}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Access key */}
            <div className="relative group">
              <button className="rounded p-1.5 text-[#444] transition-colors hover:bg-[#1a1a1a] hover:text-[#febc2e]" title="Access key">
                <Lock className="h-4 w-4" />
              </button>
              <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-56 rounded border border-[#1a1a1a] bg-[#0f0f0f] p-2 shadow-xl">
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="access key (optional)"
                  className="w-full rounded border border-[#1a1a1a] bg-[#0a0a0a] px-2 py-1 font-mono text-[10px] text-[#e0e0e0] placeholder:text-[#333] focus:border-[#00ff88] focus:outline-none"
                />
              </div>
            </div>

            {running ? (
              <button
                onClick={cancel}
                className="rounded p-1.5 text-[#ff5f57] transition-colors hover:bg-[#1a1a1a]"
                title="Cancel (Esc)"
              >
                <XCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={run}
                disabled={!prompt.trim()}
                className="rounded p-1.5 text-[#00ff88] transition-colors hover:bg-[#1a1a1a] disabled:opacity-30"
                title="Send (Enter)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#333]">
          <span>Enter send · Esc cancel · Shift+Enter newline</span>
          <span>{model || "default model"} · {files.length > 0 ? `${files.length} file(s)` : "no files"}</span>
        </div>
      </div>
    </div>
  );
}
