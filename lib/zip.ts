import JSZip from "jszip";
import type { GeneratedFile } from "@/lib/types";
import { slugify } from "@/lib/utils";

/**
 * Exports the generated project as a ZIP download.
 * The ZIP contains only the generated website files — never API keys,
 * secrets, admin configuration or internal prompts.
 */
export async function exportProjectZip(
  files: Record<string, GeneratedFile>,
  projectName: string
): Promise<void> {
  const zip = new JSZip();
  const root = slugify(projectName);

  for (const file of Object.values(files)) {
    zip.file(`${root}/${file.path}`, file.content);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${root}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
