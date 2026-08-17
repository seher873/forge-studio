import type {
  CapabilityMap,
  DesignTokens,
  GeneratedFile,
  GenerationResult,
  ProjectInfo,
} from "@/lib/types";
import { allCapabilities } from "@/lib/permissions";
import { resolveTokens, resolveAccent } from "./tokens";
import { buildSiteModel } from "./model";
import { renderProjectFiles } from "./react";
import { renderFullStackFiles } from "./fullstack";
import { renderPreviewHtml } from "./static";
import { slugify } from "@/lib/utils";

export function generateProject(
  info: ProjectInfo,
  capabilities: CapabilityMap = allCapabilities(true)
): GenerationResult {
  const model = buildSiteModel(info);
  const tokens = resolveTokens(info);
  const files = renderProjectFiles(info, model, tokens);
  const backendFiles = renderFullStackFiles({
    mode: info.mode ?? "frontend",
    capabilities,
    info,
    model,
  });
  const allFiles = { ...files, ...backendFiles };
  const previewHtml = renderPreviewHtml(model, tokens);
  const root = slugify(info.name);

  const steps = [
    `Project created — ${info.name}`,
    `Requirements processed — ${info.industry}, ${model.sections.length} sections`,
    `Components generated — ${countFiles(allFiles, "components/")} files`,
    `Styling generated — design tokens applied`,
    `Blog + legal pages generated — ${model.blog.length} posts, Terms & Privacy`,
    ...(Object.keys(backendFiles).length > 0
      ? [
          `Full-stack modules generated — ${Object.keys(backendFiles).length} files (server, API, database, auth)`,
        ]
      : []),
    `Website generated — ${Object.keys(allFiles).length} files in ${root}/`,
    `Preview ready`,
  ];

  return { files: allFiles, previewHtml, steps, root };
}

export function regenerateWithColor(
  info: ProjectInfo,
  color: string,
  capabilities?: CapabilityMap
): GenerationResult {
  return generateProject({ ...info, color }, capabilities);
}

export function regenerateWithHeroStyle(
  info: ProjectInfo,
  design: ProjectInfo["design"],
  capabilities?: CapabilityMap
): GenerationResult {
  return generateProject({ ...info, design }, capabilities);
}

export function accentSummary(info: ProjectInfo): { hex: string; key: string } {
  const resolved = resolveAccent(info);
  return { hex: resolved.hex, key: resolved.key };
}

export { resolveTokens, buildSiteModel, renderPreviewHtml };

function countFiles(files: Record<string, GeneratedFile>, prefix: string): number {
  return Object.keys(files).filter((p) => p.startsWith(prefix)).length;
}

export type { DesignTokens };
