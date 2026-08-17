"use client";

import { motion } from "framer-motion";
import { FolderOpen, Boxes } from "lucide-react";
import { useProjects } from "@/lib/store";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { ProjectCard } from "@/components/dashboard/ProjectCard";

export default function HomePage() {
  const { projects, deleteProject } = useProjects();

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-start">
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="max-w-xl"
            >
              <h1 className="font-heading text-3xl font-bold tracking-tight text-text sm:text-4xl">
                Build websites &amp; full-stack apps from a single brief.
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-dim">
                Forge Studio is a permission-controlled development platform.
                Describe what you need and the AI agent builds a complete Next.js
                14 project — frontend, and full-stack modules when your account is
                permitted — in a professional VS Code-style workspace. What you can
                see, run and export depends on the permissions the Master Admin
                granted you.
              </p>
              <div className="mt-6 grid max-w-lg grid-cols-3 gap-3 text-center">
                {[
                  ["1", "Create a brief"],
                  ["2", "Generate the project"],
                  ["3", "Preview & export ZIP"],
                ].map(([step, label]) => (
                  <div
                    key={step}
                    className="rounded-lg border border-line bg-panel px-2 py-3"
                  >
                    <p className="font-heading text-lg font-bold text-accent">{step}</p>
                    <p className="mt-0.5 text-[11px] text-dim">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
                  <FolderOpen className="h-4 w-4 text-accent" />
                  Projects
                  <span className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11px] font-medium text-faint">
                    {projects.length}
                  </span>
                </h2>
              </div>

              {projects.length === 0 ? (
                <div className="panel flex flex-col items-center gap-3 rounded-xl border-dashed px-6 py-14 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel-2">
                    <Boxes className="h-6 w-6 text-faint" />
                  </div>
                  <p className="text-sm font-medium text-dim">
                    No projects yet
                  </p>
                  <p className="max-w-sm text-xs leading-relaxed text-faint">
                    Create your first project on the right. Projects and all
                    generated files are saved locally in your browser.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onDelete={deleteProject}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:sticky lg:top-20">
            <ProjectForm />
          </div>
        </div>
      </main>

      <footer className="border-t border-line py-6">
        <p className="text-center text-[11px] text-faint">
          Forge Studio — AI Development Platform · Next.js 14 + Tailwind CSS +
          Framer Motion · Permissions enforced at every action
        </p>
      </footer>
    </div>
  );
}
