import { execSync } from "node:child_process";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let cache: { models: string[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    if (!cache || now - cache.ts > CACHE_TTL) {
      const raw = execSync("opencode models", {
        encoding: "utf-8",
        timeout: 15000,
        windowsHide: true,
      });
      const models = raw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && l.includes("/"));
      cache = { models, ts: now };
    }
    return NextResponse.json({ models: cache.models });
  } catch {
    return NextResponse.json({ models: [], error: "Failed to load models" }, { status: 500 });
  }
}
