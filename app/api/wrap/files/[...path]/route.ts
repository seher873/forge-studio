import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePath = params.path.join("/");
  const full = join(ROOT, filePath);

  try {
    const rel = relative(ROOT, full).replace(/\\/g, "/");
    if (rel.startsWith("..")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const stat = statSync(full);
    if (stat.isDirectory()) {
      return NextResponse.json({ error: "Is a directory" }, { status: 400 });
    }

    if (stat.size > 512 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const content = readFileSync(full, "utf-8");
    return NextResponse.json({
      path: rel,
      content,
      size: stat.size,
      modified: stat.mtimeMs,
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
