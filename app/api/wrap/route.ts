import { NextRequest, NextResponse } from "next/server";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 32000;
const PROJECT_ROOT = resolve(process.cwd());

const SYSTEM_PROMPT = `You are Magic.AI, a powerful coding assistant with full file system access.

When the user asks you to create, edit, or work with files, you MUST use these exact tags:

[FILE: path/to/file.ext]
file content here
[/FILE]

Rules:
- Always use relative paths from the project root
- You can create multiple files in one response
- For editing existing files, show the complete new file content
- After creating files, explain what you did
- If no file operations needed, just answer normally
- Use proper file extensions (.tsx, .ts, .js, .html, .css, .json, etc.)

Example:
[FILE: src/components/Hello.tsx]
export default function Hello() {
  return <h1>Hello World</h1>;
}
[/FILE]`;

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY not configured.");
  return key;
}

interface FileOp {
  path: string;
  content: string;
}

function parseFileOps(text: string): { cleanText: string; files: FileOp[] } {
  const files: FileOp[] = [];
  const regex = /\[FILE:\s*(.+?)\]\r?\n([\s\S]*?)\[\/FILE\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    files.push({ path: match[1].trim(), content: match[2] });
  }
  const cleanText = text.replace(/\[FILE:\s*(.+?)\]\r?\n[\s\S]*?\[\/FILE\]/g, "").trim();
  return { cleanText, files };
}

function executeFileOps(files: FileOp[]): { path: string; status: string }[] {
  const results: { path: string; status: string }[] = [];
  for (const file of files) {
    try {
      const fullPath = join(PROJECT_ROOT, file.path);
      const dir = dirname(fullPath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(fullPath, file.content, "utf-8");
      results.push({ path: file.path, status: "created" });
    } catch (e: any) {
      results.push({ path: file.path, status: "error: " + (e?.message || "unknown") });
    }
  }
  return results;
}

async function callGemini(prompt: string): Promise<string> {
  const key = getGeminiKey();
  const model = process.env.WRAP_MODEL?.trim() || "gemini-3.6-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";
  const fullPrompt = SYSTEM_PROMPT + "\n\nUser: " + prompt;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
    });
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: body,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error("Gemini " + res.status + ": " + err.slice(0, 500));
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response.");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

let busy = false;

export async function POST(request: NextRequest) {
  if (process.env.WRAP_ENABLED !== "true") {
    return NextResponse.json({ error: "Agent is disabled." }, { status: 403 });
  }
  if (busy) {
    return NextResponse.json({ error: "Agent is busy." }, { status: 429 });
  }
  let body: { prompt?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Prompt required." }, { status: 400 });
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json({ error: "Prompt too long." }, { status: 400 });
  }
  busy = true;
  try {
    const raw = await callGemini(prompt);
    const { cleanText, files } = parseFileOps(raw);
    let fileResults: { path: string; status: string }[] | undefined;
    if (files.length > 0) {
      fileResults = executeFileOps(files);
    }
    return NextResponse.json({
      ok: true,
      code: cleanText,
      ...(fileResults ? { files: fileResults } : {}),
    });
  } catch (e: any) {
    console.error("[wrap]", e);
    return NextResponse.json({ error: e?.message || "Failed." }, { status: 502 });
  } finally {
    busy = false;
  }
}
