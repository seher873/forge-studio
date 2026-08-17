import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROOT = join(process.cwd());

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  modified: number;
}

function walk(dir: string, base: string, entries: FileEntry[], depth: number) {
  if (depth > 4) return;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item.startsWith(".") || item === "node_modules" || item === ".next") continue;
      const full = join(dir, item);
      const stat = statSync(full);
      const rel = relative(base, full).replace(/\\/g, "/");
      if (stat.isDirectory()) {
        entries.push({ name: item, path: rel, type: "dir", modified: stat.mtimeMs });
        walk(full, base, entries, depth + 1);
      } else {
        entries.push({ name: item, path: rel, type: "file", modified: stat.mtimeMs });
      }
    }
  } catch {}
}

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") ?? "recent";
  const entries: FileEntry[] = [];
  walk(ROOT, ROOT, entries, 0);

  if (sort === "recent") {
    entries.sort((a, b) => b.modified - a.modified);
  } else {
    entries.sort((a, b) => a.path.localeCompare(b.path));
  }

  return NextResponse.json({ files: entries.slice(0, 200) });
}
