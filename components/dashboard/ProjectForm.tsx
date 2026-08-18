"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Palette,
  Sparkles,
  Layers,
  Wand2,
  FileText,
  Monitor,
  Server,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/lib/store";
import { usePermissions } from "@/lib/use-permissions";
import { ACCENT_COLORS, DESIGN_STYLES, INDUSTRIES } from "@/lib/generator/tokens";
import type { DesignStyle, ProjectMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const SECTION_OPTIONS = [
  { label: "About", value: "about" },
  { label: "Services", value: "services" },
  { label: "Courses", value: "courses" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Testimonials", value: "testimonials" },
  { label: "Pricing", value: "pricing" },
  { label: "FAQ", value: "faq" },
  { label: "Contact", value: "contact" },
];

const MODE_OPTIONS: Array<{
  value: ProjectMode;
  label: string;
  icon: typeof Monitor;
  description: string;
}> = [
  {
    value: "frontend",
    label: "Frontend only",
    icon: Monitor,
    description: "Next.js, React, TypeScript, Tailwind and Framer Motion.",
  },
  {
    value: "full-stack",
    label: "Full stack",
    icon: Server,
    description: "Frontend + APIs, database and authentication modules.",
  },
  {
    value: "custom",
    label: "Custom",
    icon: SlidersHorizontal,
    description: "Only capabilities enabled for your account.",
  },
];

export function ProjectForm() {
  const router = useRouter();
  const { createProject } = useProjects();
  const permissions = usePermissions();

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0].value);
  const [details, setDetails] = useState("");
  const [color, setColor] = useState("indigo");
  const [design, setDesign] = useState<DesignStyle>("modern");
  const [sections, setSections] = useState<string[]>([]);
  const [mode, setMode] = useState<ProjectMode>("frontend");
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState("");

  const canFullStack =
    permissions.backend && permissions.api && permissions.database && permissions.auth;
  const valid = name.trim().length > 0 && details.trim().length > 8;
  const colorHex = useMemo(() => ACCENT_COLORS[color]?.hex ?? "#4f46e5", [color]);

  const toggleSection = (value: string) => {
    setSections((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (details.trim().length < 8) {
      setError("Describe the project in at least a few words so the generator has enough to work with.");
      return;
    }
    setError("");
    const project = createProject({
      name: name.trim(),
      industry,
      details: details.trim(),
      color,
      design,
      sections,
      mode,
      createdAt: Date.now(),
    });
    router.push(`/workspace/${project.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="panel overflow-hidden rounded-xl"
    >
      <div className="flex items-center gap-2 border-b border-line bg-panel-2/60 px-5 py-3.5">
        <Wand2 className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-text">Create a new project</h2>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="space-y-1.5">
          <label htmlFor="project-name" className="flex items-center gap-1.5 text-xs font-medium text-dim">
            <FileText className="h-3.5 w-3.5" />
            Project name
            <span className="text-err">*</span>
          </label>
          <Input
            id="project-name"
            placeholder="e.g. Haq Skill Era IT Center"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-type" className="flex items-center gap-1.5 text-xs font-medium text-dim">
            <Layers className="h-3.5 w-3.5" />
            Project type / industry
            <span className="text-err">*</span>
          </label>
          <Select
            id="project-type"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="project-details" className="flex items-center gap-1.5 text-xs font-medium text-dim">
            <Sparkles className="h-3.5 w-3.5" />
            Project details
            <span className="text-err">*</span>
          </label>
          <Textarea
            id="project-details"
            rows={5}
            placeholder={
              "Describe the website you want to generate.\n\ne.g. Create a professional website for an IT training center offering MS Office, Web Development, Python and Canva courses."
            }
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <p className="text-[11px] text-faint">
            The generator reads this to decide which sections and content to build.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-dim">
            <Layers className="h-3.5 w-3.5" />
            Project mode
          </label>
          <div className="grid grid-cols-1 gap-2">
            {MODE_OPTIONS.map((m) => {
              const Icon = m.icon;
              const locked = m.value === "full-stack" && !canFullStack;
              const active = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={locked}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                    locked && "cursor-not-allowed opacity-50",
                    active
                      ? "border-accent/60 bg-accent-soft"
                      : "border-line bg-panel-2/50 hover:border-line-strong"
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      active ? "text-accent" : "text-faint"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
                      {m.label}
                      {locked ? <Lock className="h-3 w-3 text-warn" /> : null}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-faint">
                      {locked
                        ? "Requires backend, API, database and auth permissions."
                        : m.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-faint">
            Full-stack projects include server, API, database and authentication
            modules — only for the capabilities your account has been granted.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="flex w-full items-center justify-between rounded-md border border-line bg-panel-2/50 px-3 py-2.5 text-xs font-medium text-dim transition-colors hover:border-line-strong hover:text-text"
        >
          <span className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5" />
            Design options
            <span className="text-faint">(optional)</span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              showOptions && "rotate-180"
            )}
          />
        </button>

        {showOptions ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-5 overflow-hidden"
          >
            <div className="space-y-2">
              <p className="text-xs font-medium text-dim">Colour preference</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACCENT_COLORS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    title={key}
                    onClick={() => setColor(key)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110",
                      color === key
                        ? "border-text shadow-glow"
                        : "border-transparent"
                    )}
                    style={{ background: value.hex }}
                    aria-label={`Colour ${key}`}
                  >
                    {color === key ? (
                      <span className="h-2 w-2 rounded-full bg-white/90" />
                    ) : null}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-faint">
                Selected: <span style={{ color: colorHex }}>{color}</span> — applied as the accent colour.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-dim">Design preference</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(DESIGN_STYLES) as DesignStyle[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDesign(s)}
                    className={cn(
                      "rounded-md border px-3 py-2.5 text-left transition-colors",
                      design === s
                        ? "border-accent/60 bg-accent-soft"
                        : "border-line bg-panel-2/50 hover:border-line-strong"
                    )}
                  >
                    <p className="text-xs font-semibold capitalize text-text">{s}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-faint">
                      {DESIGN_STYLES[s].split("—")[1]?.trim()}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-dim">Required sections</p>
              <div className="flex flex-wrap gap-1.5">
                {SECTION_OPTIONS.map((s) => {
                  const active = sections.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSection(s.value)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                        active
                          ? "border-accent/60 bg-accent-soft text-accent"
                          : "border-line-strong bg-panel-2/50 text-dim hover:text-text"
                      )}
                    >
                      {active ? "✓ " : "+ "}
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-faint">
                Leave empty to let the generator choose sections automatically.
              </p>
            </div>
          </motion.div>
        ) : null}

        {error ? (
          <p className="rounded-md border border-err/30 bg-err/10 px-3 py-2 text-xs text-err">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <Button
            variant="primary"
            size="lg"
            disabled={!valid}
            onClick={handleSubmit}
          >
            Create project &amp; open workspace
          </Button>
          <p className="text-center text-[11px] text-faint">
            Projects are stored locally in this browser. No account or backend required.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
