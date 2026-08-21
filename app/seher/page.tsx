"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FolderUp,
  X,
  XCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useProjects } from "@/lib/store";

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
            className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-mono transition-all hover:bg-white/[0.04] ${
              selected === entry.path
                ? "bg-cyan-400/[0.08] text-cyan-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            {entry.type === "dir" ? (
              <>
                {expanded[entry.path] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                {expanded[entry.path] ? <FolderOpen className="h-3 w-3 shrink-0 text-amber-400" /> : <Folder className="h-3 w-3 shrink-0 text-amber-400" />}
              </>
            ) : (
              <>
                <span className="w-3" />
                {entry.name.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) ? (
                  <ImageIcon className="h-3 w-3 shrink-0 text-violet-400" />
                ) : (
                  <FileText className="h-3 w-3 shrink-0 text-zinc-600" />
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
  const folderInputRef = useRef<HTMLInputElement>(null);
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
      const displayName = (f as any).webkitRelativePath || f.name;
      if (isText) {
        const text = await f.text();
        added.push({ name: displayName, type: "text", content: text });
      } else if (isImage) {
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        added.push({ name: displayName, type: "image", content: b64 });
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
      const fileResults = data.files as { path: string; status: string }[] | undefined;
      let displayText = code;
      if (fileResults && fileResults.length > 0) {
        const fileSummary = fileResults.map((f) => `${f.status === "created" ? "✓" : "✗"} ${f.path}`).join("\n");
        displayText = `[Files created]\n${fileSummary}\n\n${code}`;
      }
      setResult(displayText);
      setHistory((h) => [...h, { role: "agent", text: displayText }]);
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
      <div className="holo-bg flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel mx-4 flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-12 py-16 text-center backdrop-blur-xl"
        >
          <ShieldOff className="mb-6 h-12 w-12 text-red-400/60" />
          <p className="font-mono text-sm font-semibold tracking-wide text-red-400/80">ACCESS DENIED</p>
          <p className="mt-2 font-mono text-xs text-zinc-600">This terminal is restricted to the operator.</p>
          <Link
            href="/"
            className="glass-btn mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs text-cyan-400/80 transition-all hover:text-cyan-400"
          >
            &lt;- return to dashboard
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="holo-bg flex h-screen flex-col font-mono text-zinc-300">
      {/* Header */}
      <header className="glass-header flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-4">
          <div className="orbital">
            <div className="orbital-ring" />
            <div className="orbital-ring" />
            <div className="orbital-dot" />
            <div className="orbital-dot" />
            <div className="orbital-dot" />
            <div className="orbital-nucleus" />
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400/60" />
            <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">MAGIC.AI</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowFiles(!showFiles); if (!showFiles) fetchFiles(); }}
            className={`glass-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition-all ${showFiles ? "text-cyan-400" : "text-zinc-500 hover:text-cyan-400"}`}
          >
            {showFiles ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            files
          </button>
          <Link href="/" className="glass-btn flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] text-zinc-500 transition-all hover:text-cyan-400">
            &lt;- dashboard
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Main chat area */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-4">
            {history.length === 0 && !running && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center justify-center py-20"
              >
                  <div className="holo-orb mx-auto mb-8 h-28 w-28">
                    <img src="/image.png" alt="avatar" />
                  </div>
                <h1 className="text-lg font-semibold tracking-wide text-zinc-300">
                  MAGIC<span className="text-purple-400/70">.AI</span>
                </h1>
                <p className="mt-2 text-xs text-zinc-600">Type your prompt and press Enter. Esc to cancel.</p>
                <p className="mt-1 text-xs text-zinc-600">Attach files with the clip icon below.</p>
              </motion.div>
            )}

            {history.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-3"
              >
                {entry.role === "user" ? (
                  <div className="glass-panel-user rounded-xl px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400/60">You</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-zinc-300">{entry.text}</p>
                  </div>
                ) : (
                  <div className="glass-panel-agent rounded-xl px-4 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-violet-400/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/60">Agent</span>
                      <button
                        onClick={() => copy(entry.text)}
                        className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-zinc-600 transition-colors hover:bg-white/[0.04] hover:text-zinc-400"
                      >
                        {copied ? <Check className="h-2.5 w-2.5" /> : <Copy className="h-2.5 w-2.5" />}
                        {copied ? "copied" : "copy"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-400">{entry.text}</pre>
                  </div>
                )}
              </motion.div>
            ))}

            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-3 flex items-center gap-3 rounded-xl border border-violet-400/[0.08] bg-violet-400/[0.04] px-4 py-3"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-400/50" />
                <div className="holo-dots flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </div>
                <span className="text-[11px] text-zinc-600">thinking...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* File sidebar */}
        <AnimatePresence>
          {showFiles && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="glass-sidebar flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.04]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.04] px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">Files</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFileSort("recent")}
                    className={`text-[10px] transition-colors ${fileSort === "recent" ? "text-cyan-400" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    recent
                  </button>
                  <button
                    onClick={() => setFileSort("alpha")}
                    className={`text-[10px] transition-colors ${fileSort === "alpha" ? "text-cyan-400" : "text-zinc-600 hover:text-zinc-400"}`}
                  >
                    A-Z
                  </button>
                  <button onClick={fetchFiles} className="text-[10px] text-zinc-600 hover:text-cyan-400">↻</button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-1.5">
                <FileTree entries={fileTree} level={0} onSelect={openFile} selected={selectedFile ?? ""} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File preview */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 384, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="glass-sidebar flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.04]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.04] px-3 py-2">
                <span className="truncate text-[11px] text-zinc-500">{selectedFile}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { if (fileContent) navigator.clipboard.writeText(fileContent); }}
                    className="text-zinc-600 transition-colors hover:text-cyan-400"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button onClick={() => { setSelectedFile(null); setFileContent(null); }} className="text-zinc-600 transition-colors hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                {fileContent ?? "Loading..."}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="glass-input-area px-4 py-3">
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {files.map((f, i) => (
              <span key={i} className="holo-chip inline-flex items-center gap-1.5 px-2 py-1 text-[10px] text-zinc-500">
                {f.type === "image" ? <ImageIcon className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
                {f.name}
                <button onClick={() => removeFile(i)} className="ml-0.5 transition-colors hover:text-red-400"><X className="h-2.5 w-2.5" /></button>
              </span>
            ))}
          </div>
        )}

        <div className="glow-input flex items-end gap-2 px-3 py-2.5">
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
            className="flex-1 resize-none bg-transparent font-mono text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none disabled:opacity-50"
          />

          <div className="flex items-center gap-1 pb-0.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".ts,.tsx,.js,.jsx,.json,.md,.css,.html,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.sh,.yaml,.yml,.toml,.env,.sql,.graphql,.prisma,.txt,.png,.jpg,.jpeg,.gif,.webp"
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
            <input
              ref={folderInputRef}
              type="file"
              {...{ webkitdirectory: "" } as any}
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="glass-btn rounded-lg p-2 text-zinc-600 transition-all hover:text-cyan-400"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="glass-btn rounded-lg p-2 text-zinc-600 transition-all hover:text-cyan-400"
              title="Upload folder"
            >
              <FolderUp className="h-4 w-4" />
            </button>

            <div ref={modelDropRef} className="relative">
              <button
                onClick={() => setShowModels(!showModels)}
                className="glass-btn rounded-lg p-2 text-zinc-600 transition-all hover:text-violet-400"
                title={model || "Select model"}
              >
                <Terminal className="h-4 w-4" />
              </button>
              {showModels && (
                <div className="absolute bottom-full right-0 mb-2 w-72 max-h-60 overflow-auto rounded-xl border border-white/[0.06] bg-[#0a0e16]/90 shadow-2xl backdrop-blur-xl">
                  <div className="sticky top-0 border-b border-white/[0.04] bg-[#0a0e16]/80 p-2 backdrop-blur-md">
                    <input
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="search models..."
                      autoFocus
                      className="w-full bg-transparent font-mono text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none"
                    />
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => { setModel(""); setModelSearch(""); setShowModels(false); }}
                      className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-white/[0.04] ${!model ? "text-cyan-400" : "text-zinc-500"}`}
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
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-white/[0.04] ${m === model ? "text-cyan-400" : "text-zinc-500"}`}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative group">
              <button className="glass-btn rounded-lg p-2 text-zinc-600 transition-all hover:text-amber-400" title="Access key">
                <Lock className="h-4 w-4" />
              </button>
              <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-56 rounded-xl border border-white/[0.06] bg-[#0a0e16]/90 p-2 shadow-2xl backdrop-blur-xl">
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="access key (optional)"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] text-zinc-300 placeholder:text-zinc-600 focus:border-cyan-400/30 focus:outline-none"
                />
              </div>
            </div>

            {running ? (
              <button
                onClick={cancel}
                className="glass-btn rounded-lg p-2 text-red-400 transition-all hover:bg-red-400/10"
                title="Cancel (Esc)"
              >
                <XCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={run}
                disabled={!prompt.trim()}
                className="glass-btn rounded-lg p-2 text-cyan-400 transition-all hover:bg-cyan-400/10 disabled:opacity-20"
                title="Send (Enter)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-zinc-600">
          <span>Enter send · Esc cancel · Shift+Enter newline</span>
          <span>{model || "default model"} · {files.length > 0 ? `${files.length} file(s)` : "no files"}</span>
        </div>
      </div>
    </div>
  );
}
