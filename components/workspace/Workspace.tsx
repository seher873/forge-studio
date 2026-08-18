"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Files,
  Code2,
  Bot,
  TerminalSquare,
  ArrowLeft,
  Hammer,
} from "lucide-react";
import { useProjects } from "@/lib/store";
import { resolveUserPermissions } from "@/lib/permissions";
import type {
  AIProposedChange,
  CapabilityMap,
  DesignStyle,
  GeneratedFile,
  LogLine,
  Project,
} from "@/lib/types";
import { fileLanguage, uid } from "@/lib/utils";
import { generateProject } from "@/lib/generator";
import { exportProjectZip } from "@/lib/zip";
import { cn } from "@/lib/utils";

import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { ActivityBar, type ActivityKey } from "@/components/workspace/ActivityBar";
import { FileExplorer } from "@/components/workspace/FileExplorer";
import { EditorTabs } from "@/components/workspace/EditorTabs";
import { CodeEditor } from "@/components/workspace/CodeEditor";
import { PreviewPanel } from "@/components/workspace/PreviewPanel";
import { AIAgent } from "@/components/workspace/AIAgent";
import { SettingsPanel } from "@/components/workspace/SettingsPanel";
import { TerminalPanel } from "@/components/workspace/TerminalPanel";
import { StatusBar } from "@/components/workspace/StatusBar";
import { ConfirmDialog } from "@/components/ui/dialog";

type MobileView = "files" | "editor" | "ai" | "output";

type ConfirmAction =
  | { kind: "generate" }
  | { kind: "color"; color: string }
  | { kind: "design"; design: DesignStyle }
  | { kind: "clear" };

function timeNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { getProject, updateProject, activeUser, profiles, agentSettings } = useProjects();
  const project = getProject(params.id);

  const permissions: CapabilityMap = useMemo(
    () => resolveUserPermissions(activeUser, profiles),
    [activeUser, profiles]
  );
  const canGenerate = permissions.generation;
  const canDownload = permissions.zip_export;
  const canEditor = permissions.code_editor;
  const canTerminal = permissions.terminal;
  const canPackages = permissions.packages;
  const canAi = permissions.ai_agent;
  const isAdmin =
    activeUser?.role === "MASTER_ADMIN" || activeUser?.role === "ADMIN";
  const activeName = activeUser?.name ?? "Unknown user";
  const profileName = profiles.find((p) => p.id === activeUser?.profileId)?.name ?? "";

  const [files, setFiles] = useState<Record<string, GeneratedFile>>(project?.files ?? {});
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [lines, setLines] = useState<LogLine[]>([]);
  const [activity, setActivity] = useState<ActivityKey>("files");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  useEffect(() => {
    if (project) setFiles(project.files);
  }, [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (project && lines.length === 0) {
      pushLog(`Forge Studio workspace opened for "${project.info.name}".`, "info");
      pushLog(
        project.status === "generated"
          ? `Project already generated — ${Object.keys(project.files).length} files available.`
          : "No files yet. Click Generate website to build the project.",
        "info"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const pushLog = useCallback((text: string, level: LogLine["level"] = "info") => {
    setLines((prev) => [...prev.slice(-400), { id: uid(), time: timeNow(), level, text }]);
  }, []);

  const fileCount = Object.keys(files).length;
  const selectedContent = activeTab && activeTab !== "preview" ? files[activeTab]?.content ?? "" : "";
  const selectedPath = activeTab && activeTab !== "preview" ? activeTab : null;

  /* ------------------------- generation ------------------------- */

  const applyResult = useCallback(
    (result: ReturnType<typeof generateProject>, p: Project) => {
      setFiles(result.files);
      const pagePath = "app/page.tsx";
      setOpenTabs([pagePath, ...Object.keys(result.files).filter((f) => f !== pagePath)].slice(0, 12));
      setActiveTab(pagePath);
      setDirty({});
      updateProject(p.id, {
        files: result.files,
        previewHtml: result.previewHtml,
        status: "generated",
      });
      pushLog(`Generated ${Object.keys(result.files).length} files into ${result.root}/`, "success");
    },
    [updateProject, pushLog]
  );

  const runWithAnimation = useCallback(
    async (result: ReturnType<typeof generateProject>, p: Project) => {
      setGenerating(true);
      try {
        for (const step of result.steps) {
          pushLog(step, "success");
          await sleep(320);
        }
        applyResult(result, p);
      } catch (err) {
        pushLog(
          `Generation failed. Reason: ${err instanceof Error ? err.message : "unable to generate the requested project"}`,
          "error"
        );
        updateProject(p.id, { status: "failed" });
      } finally {
        setGenerating(false);
      }
    },
    [applyResult, pushLog, updateProject]
  );

  const requestGenerate = useCallback(() => {
    if (!project) return;
    if (!canGenerate) {
      pushLog(
        "Permission denied. Website generation is disabled for your current account. Please contact the Master Admin.",
        "warn"
      );
      return;
    }
    if (fileCount > 0) {
      setConfirmAction({ kind: "generate" });
    } else {
      runWithAnimation(generateProject(project.info, permissions), project);
    }
  }, [canGenerate, fileCount, project, permissions, runWithAnimation, pushLog]);

  const handleConfirm = useCallback(() => {
    if (!confirmAction || !project) return;
    const action = confirmAction;
    setConfirmAction(null);

    if (action.kind === "generate") {
      runWithAnimation(generateProject(project.info, permissions), project);
    } else if (action.kind === "color") {
      const updated = { ...project, info: { ...project.info, color: action.color } };
      updateProject(project.id, { info: updated.info });
      runWithAnimation(generateProject(updated.info, permissions), updated);
    } else if (action.kind === "design") {
      const updated = { ...project, info: { ...project.info, design: action.design } };
      updateProject(project.id, { info: updated.info });
      runWithAnimation(generateProject(updated.info, permissions), updated);
    } else if (action.kind === "clear") {
      setFiles({});
      setOpenTabs([]);
      setActiveTab("preview");
      setDirty({});
      updateProject(project.id, { files: {}, previewHtml: "", status: "created" });
      pushLog("Generated files cleared.", "warn");
    }
  }, [confirmAction, project, permissions, runWithAnimation, updateProject, pushLog]);

  /* --------------------------- editing --------------------------- */

  const handleSelectFile = useCallback(
    (path: string) => {
      setActiveTab(path);
      setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
      if (window.matchMedia("(max-width: 767px)").matches) setMobileView("editor");
    },
    []
  );

  const handleCloseTab = useCallback(
    (path: string) => {
      const next = openTabs.filter((t) => t !== path);
      setOpenTabs(next);
      if (activeTab === path) setActiveTab(next[next.length - 1] ?? "preview");
    },
    [openTabs, activeTab]
  );

  const handleEditorChange = useCallback(
    (path: string, value: string) => {
      setFiles((prev) => ({ ...prev, [path]: { ...prev[path], content: value } }));
      setDirty((prev) => ({ ...prev, [path]: true }));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!canEditor) {
      pushLog(
        "Permission denied. Code editing is disabled for your current account. Please contact the Master Admin.",
        "warn"
      );
      return;
    }
    if (!project) return;
    updateProject(project.id, { files });
    setDirty({});
    pushLog("Changes saved.", "success");
  }, [canEditor, project, files, updateProject, pushLog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  /* ---------------------------- terminal ------------------------- */

  const handleCommand = useCallback(
    (cmd: string) => {
      const c = cmd.trim().toLowerCase();
      if (!project) return;

      if (!canTerminal) {
        pushLog(
          "Permission denied. Terminal access is disabled for your current account. Please contact the Master Admin.",
          "warn"
        );
        return;
      }

      const isInstall = /^(npm\s+(install|i|add)\b|pnpm\s+(add|install)\b|yarn\s+add\b)/.test(c);

      if (c === "help") {
        pushLog(
          "Available commands: help, status, whoami, clear, echo. Shell execution is restricted for safety.",
          "cmd"
        );
      } else if (c === "status") {
        pushLog(
          `Project "${project.info.name}" | ${fileCount} files | status: ${project.status}`,
          "info"
        );
      } else if (c === "clear") {
        setLines([]);
      } else if (c === "whoami") {
        pushLog(activeName, "cmd");
      } else if (c.startsWith("echo ")) {
        pushLog(cmd.slice(5), "cmd");
      } else if (isInstall) {
        if (canPackages) {
          pushLog(
            "Package installation is simulated — no packages are actually installed. Add new dependencies to package.json and regenerate.",
            "warn"
          );
        } else {
          pushLog(
            "Permission denied. Package installation is disabled for your current account. Please contact the Master Admin.",
            "warn"
          );
        }
      } else {
        pushLog(
          `Command "${cmd}" is not permitted. Forge Studio restricts arbitrary shell execution for safety.`,
          "warn"
        );
      }
    },
    [canTerminal, canPackages, pushLog, project, fileCount, activeName]
  );

  /* ------------------------------ AI ----------------------------- */

  const handleApplyChanges = useCallback(
    (changes: AIProposedChange[]) => {
      if (!changes.length) return;
      if (!canAi || !agentSettings.enabled) {
        pushLog(
          "Permission denied. The AI Agent is disabled for your current account or by the Master Admin.",
          "warn"
        );
        return;
      }
      setFiles((prev) => {
        const next = { ...prev };
        for (const ch of changes) {
          if (next[ch.path]) {
            next[ch.path] = { ...next[ch.path], content: ch.content };
          } else {
            next[ch.path] = { path: ch.path, content: ch.content, language: fileLanguage(ch.path) };
          }
        }
        return next;
      });
      setOpenTabs((prev) => {
        const added = changes.map((c) => c.path).filter((p) => !prev.includes(p));
        return [...prev, ...added];
      });
      setActiveTab(changes[0].path);
      setDirty((prev) => {
        const next = { ...prev };
        changes.forEach((c) => (next[c.path] = true));
        return next;
      });
      pushLog(`Applied ${changes.length} AI change(s) locally — save to persist.`, "info");
    },
    [pushLog, canAi, agentSettings.enabled]
  );

  /* ---------------------------- download ------------------------- */

  const handleDownload = useCallback(async () => {
    if (!project) return;
    if (!canDownload) {
      pushLog(
        "Permission denied. ZIP export is disabled for your current account. Please contact the Master Admin.",
        "warn"
      );
      return;
    }
    if (!fileCount) return;
    setDownloading(true);
    try {
      await exportProjectZip(files, project.info.name);
      pushLog(`Exported "${project.info.name}" project as a ZIP file.`, "success");
    } catch (err) {
      pushLog(`ZIP export failed: ${err instanceof Error ? err.message : "unknown error"}`, "error");
    } finally {
      setDownloading(false);
    }
  }, [canDownload, files, fileCount, project, pushLog]);

  /* ----------------------------- layout -------------------------- */

  const handleActivity = (key: ActivityKey) => {
    setActivity(key);
    if (key === "files") {
      setLeftOpen((v) => !v);
    } else {
      setRightOpen((v) => !v);
    }
  };

  const renderCenter = () => {
    if (!project) return null;
    return (
    <>
      <EditorTabs
        tabs={openTabs}
        active={activeTab}
        dirty={dirty}
        onSelect={handleSelectFile}
        onClose={handleCloseTab}
        onSave={handleSave}
      />
      <div className="min-h-0 flex-1">
        {activeTab === "preview" ? (
          <PreviewPanel html={project.previewHtml} projectName={project.info.name} />
        ) : (
          <CodeEditor
            path={activeTab}
            value={selectedContent}
            onChange={(v) => handleEditorChange(activeTab, v)}
            language={files[activeTab]?.language ?? "typescript"}
            readOnly={!canEditor}
          />
        )}
      </div>
    </>
    );
  };

  const renderAI = () => {
    if (!project) return null;
    return (
    <AIAgent
      project={project}
      selectedPath={selectedPath}
      selectedContent={selectedContent}
      permissions={permissions}
      canAi={canAi}
      agentEnabled={agentSettings.enabled}
      agentInstructions={agentSettings.instructions}
      agentModel={agentSettings.model}
      userName={activeName}
      role={activeUser?.role ?? "USER"}
      profileName={profileName}
      onAiEnabledChange={(enabled) => {
        updateProject(project.id, { aiEnabled: enabled });
        pushLog(enabled ? "AI Agent enabled." : "AI Agent disabled.", "warn");
      }}
      onApplyChanges={handleApplyChanges}
      onQuickColor={(color) => setConfirmAction({ kind: "color", color })}
      onQuickDesign={(design) => setConfirmAction({ kind: "design", design })}
      onLog={pushLog}
    />
    );
  };

  const renderSettings = () => {
    if (!project) return null;
    return (
    <SettingsPanel
      project={project}
      isAdmin={isAdmin}
      canGenerate={canGenerate}
      onAiEnabledChange={(enabled) => {
        updateProject(project.id, { aiEnabled: enabled });
        pushLog(enabled ? "AI Agent enabled." : "AI Agent disabled.", "warn");
      }}
      onRegenerate={requestGenerate}
      onClearFiles={() => setConfirmAction({ kind: "clear" })}
    />
    );
  };

  const desktopLayout = (
    <div className="hidden min-h-0 flex-1 md:flex">
      <ActivityBar active={activity} onSelect={handleActivity} />
      {leftOpen ? (
        <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel">
          <FileExplorer
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelectFile}
            generating={generating}
            fileCount={fileCount}
          />
        </aside>
      ) : null}
      <main className="flex min-w-0 flex-1 flex-col">
        {renderCenter()}
        <TerminalPanel
          lines={lines}
          onCommand={handleCommand}
          open={bottomOpen}
          enabled={canTerminal}
          userName={activeName}
          onToggle={() => setBottomOpen((v) => !v)}
        />
      </main>
      {rightOpen ? (
        <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-panel">
          {activity === "ai" ? renderAI() : renderSettings()}
        </aside>
      ) : null}
    </div>
  );

  const mobileLayout = (
    <div className="flex min-h-0 flex-1 md:hidden">
      {mobileView === "files" ? (
        <div className="flex w-full flex-col bg-panel">
          <FileExplorer
            files={files}
            selectedPath={selectedPath}
            onSelect={handleSelectFile}
            generating={generating}
            fileCount={fileCount}
          />
        </div>
      ) : null}
      {mobileView === "editor" ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {renderCenter()}
          <TerminalPanel
            lines={lines}
            onCommand={handleCommand}
            open={bottomOpen}
            enabled={canTerminal}
            userName={activeName}
            onToggle={() => setBottomOpen((v) => !v)}
          />
        </div>
      ) : null}
      {mobileView === "ai" ? (
        <div className="flex w-full flex-col bg-panel">
          {activity === "ai" ? renderAI() : renderSettings()}
        </div>
      ) : null}
      {mobileView === "output" ? (
        <div className="flex w-full flex-col bg-panel">
          <div className="h-full">
            <TerminalPanel
              lines={lines}
              onCommand={handleCommand}
              open={true}
              enabled={canTerminal}
              userName={activeName}
              onToggle={() => setMobileView("editor")}
            />
          </div>
        </div>
      ) : null}
    </div>
  );

  const confirmMeta = useMemo(() => {
    switch (confirmAction?.kind) {
      case "generate":
        return {
          title: "Regenerate website",
          description:
            "Regenerating will replace all generated code with a fresh build from the project brief. Any unsaved edits will be lost. Continue?",
          label: "Regenerate",
        };
      case "color":
        return {
          title: "Change accent colour",
          description: `Rebuild the website with the ${confirmAction.color} accent colour? This replaces the current generated code.`,
          label: "Apply colour",
        };
      case "design":
        return {
          title: "Change design style",
          description: `Rebuild the website with the ${confirmAction.design} design style? This replaces the current generated code.`,
          label: "Apply style",
        };
      case "clear":
        return {
          title: "Clear generated files",
          description: "This removes every generated file from the workspace. Continue?",
          label: "Clear files",
        };
      default:
        return { title: "", description: "", label: "Continue" };
    }
  }, [confirmAction]);

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-panel">
          <Hammer className="h-6 w-6 text-faint" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-text">Project not found</p>
          <p className="mt-1 text-xs text-dim">
            This project may have been deleted from this browser.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-xs text-text transition-colors hover:border-accent/40"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WorkspaceHeader
        project={project}
        generating={generating}
        onGenerate={requestGenerate}
        onDownload={handleDownload}
        downloading={downloading}
        canGenerate={canGenerate}
        canDownload={canDownload}
      />

      <div className="flex items-center gap-1 overflow-x-auto border-b border-line bg-panel px-2 py-1.5 md:hidden">
        {(
          [
            ["files", Files, "Explorer"],
            ["editor", Code2, "Code"],
            ["ai", Bot, "AI Agent"],
            ["output", TerminalSquare, "Output"],
          ] as const
        ).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => {
              if (key === "ai") setActivity("ai");
              setMobileView(key);
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors",
              mobileView === key
                ? "bg-panel-3 text-text"
                : "text-dim hover:bg-panel-2 hover:text-text"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {desktopLayout}
        {mobileLayout}
      </div>

      <StatusBar
        project={project}
        selectedFile={selectedPath}
        generationCount={fileCount}
        aiAvailable={project.aiEnabled}
        user={activeUser}
        profileName={profileName}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmMeta.title}
        description={confirmMeta.description}
        confirmLabel={confirmMeta.label}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
