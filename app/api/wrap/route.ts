import { execSync, spawn, type ChildProcess } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

/**
 * Personal opencode wrapper.
 *
 * This route runs the local `opencode run` CLI on the server and returns the
 * assistant's message as plain text. It is the owner's private coding helper:
 *
 *  - Enabled only when WRAP_ENABLED=true is set in .env.local on the server.
 *  - Optional shared secret via WRAP_KEY — the browser sends it in the
 *    x-wrap-key header; it never touches the client bundle.
 *  - The prompt is written to the CLI's stdin (never to argv), so no shell
 *    string is ever built from user input — command injection is impossible.
 *  - The optional model is validated against a strict allowlist before it is
 *    allowed anywhere near the command line.
 *  - Each run uses a fully isolated opencode profile (own XDG data/cache/
 *    config/state dirs), so it never contends with the owner's interactive
 *    opencode session or its session database. No run blocks on a lock.
 *  - Model credentials come from server-only provider env vars (e.g.
 *    GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY,
 *    ANTHROPIC_API_KEY). They are inherited by the child and never sent to
 *    the browser.
 *  - Error responses never echo the prompt, the command line or secrets.
 */
export const dynamic = "force-dynamic";

const MAX_PROMPT_LENGTH = 8000;
const RUN_TIMEOUT_MS = 180_000;
const MAX_OUTPUT_BYTES = 16 * 1024 * 1024;
const MODEL_PATTERN = /^[A-Za-z0-9_.\-/]+$/;

const IDLE_MS = 30_000;

function findOpencodeBinary(): string {
  if (process.platform !== "win32") return "opencode";
  try {
    const where = execSync("where opencode.cmd", {
      encoding: "utf-8",
      timeout: 5000,
      windowsHide: true,
    }).trim();
    const shimDir = path.dirname(where.split("\r\n")[0] || where.split("\n")[0]);
    return path.join(shimDir, "node_modules", "opencode-ai", "bin", "opencode.exe");
  } catch {
    return "opencode";
  }
}

const OPENCODE_BIN = findOpencodeBinary();

function wrapBaseDir(): string {
  return process.platform === "win32"
    ? path.join(process.env.LOCALAPPDATA ?? homedir(), "forge-studio", "wrap")
    : path.join(homedir(), ".local", "state", "forge-studio", "wrap");
}

function childEnv(): NodeJS.ProcessEnv {
  const base = wrapBaseDir();
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    XDG_DATA_HOME: path.join(base, "data"),
    XDG_CACHE_HOME: path.join(base, "cache"),
    XDG_CONFIG_HOME: path.join(base, "config"),
    XDG_STATE_HOME: path.join(base, "state"),
    TMP: path.join(base, "tmp"),
    TEMP: path.join(base, "tmp"),
    OPENCODE_DISABLE_AUTOUPDATE: "true",
    OPENCODE_DISABLE_PRUNE: "true",
    OPENCODE_DISABLE_LSP_DOWNLOAD: "true",
    OPENCODE_DISABLE_TERMINAL_TITLE: "true",
    OPENCODE_CLIENT: "forge-studio",
  };
  if (process.env.GEMINI_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
  }
  return env;
}

function runCli(prompt: string, model?: string, signal?: AbortSignal): Promise<string> {
  const args = ["run"];
  if (model) args.push("--model", model);

  const env = childEnv();
  for (const dir of [
    env.XDG_DATA_HOME,
    env.XDG_CACHE_HOME,
    env.XDG_CONFIG_HOME,
    env.XDG_STATE_HOME,
    env.TMP,
  ]) {
    if (dir) mkdirSync(dir, { recursive: true });
  }

  let child: ChildProcess;
  if (process.platform === "win32") {
    child = spawn(OPENCODE_BIN, args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      env,
    });
  } else {
    child = spawn("opencode", args, { stdio: ["pipe", "pipe", "pipe"], env });
  }

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false;

    const killTree = () => {
      if (!child.pid) return;
      if (process.platform === "win32") {
        spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
      } else {
        child.kill();
      }
    };

    const onAbort = () => {
      if (!settled) killTree();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    const timer = setTimeout(() => {
      if (!settled) {
        killTree();
        settled = true;
        signal?.removeEventListener("abort", onAbort);
        reject(new Error("Timed out."));
      }
    }, RUN_TIMEOUT_MS);

    const finish = (fn: () => void) => () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        clearTimeout(idleTimer);
        signal?.removeEventListener("abort", onAbort);
        fn();
      }
    };

    let idleTimer = setTimeout(() => onIdle(), IDLE_MS);
    function onIdle() {
      if (!settled && (stdout.length > 0 || stderr.length > 0)) {
        killTree();
        if (stdout.trim()) {
          finish(() => resolve(stdout))();
        } else {
          finish(() => reject(new Error(stderr.trim() || "Process became idle with no output.")))();
        }
      }
    }
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => onIdle(), IDLE_MS);
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
        killTree();
        finish(() => reject(new Error("Output too large.")))();
        return;
      }
      stdout += chunk.toString();
      resetIdle();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString().slice(-4096);
      resetIdle();
    });
    child.on("error", finish(() => reject(new Error("Could not start opencode."))));
    child.on("close", (code) =>
      finish(() => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `opencode exited with code ${code}.`));
        } else {
          resolve(stdout);
        }
      })
    );

    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

let busy = false;

export async function POST(request: NextRequest) {
  if (process.env.WRAP_ENABLED !== "true") {
    return NextResponse.json(
      {
        error:
          "The personal coding assistant is disabled. Set WRAP_ENABLED=true in .env.local on the server.",
      },
      { status: 403 }
    );
  }

  const secret = process.env.WRAP_KEY;
  if (secret) {
    const provided = request.headers.get("x-wrap-key");
    if (!provided || provided !== secret) {
      return NextResponse.json(
        { error: "Missing or invalid access key." },
        { status: 401 }
      );
    }
  }

  if (busy) {
    return NextResponse.json(
      { error: "Another request is already running. Wait for it to finish and try again." },
      { status: 429 }
    );
  }

  let body: { prompt?: unknown; model?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters).` },
      { status: 400 }
    );
  }

  let model: string | undefined =
    typeof body.model === "string" && body.model.trim()
      ? body.model.trim()
      : process.env.WRAP_MODEL?.trim() || undefined;
  if (model && !MODEL_PATTERN.test(model)) {
    return NextResponse.json(
      { error: "Model must match provider/model (letters, digits, dots, dashes, slashes)." },
      { status: 400 }
    );
  }

  busy = true;
  try {
    const stdout = await runCli(prompt, model, request.signal);
    const code = stdout.trim();
    if (!code) {
      return NextResponse.json(
        { error: "The assistant returned an empty response." },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json(
      {
        error:
          "The coding assistant could not complete the request. Try a shorter prompt, or check that opencode is installed and the model key is configured on the server.",
      },
      { status: 502 }
    );
  } finally {
    busy = false;
  }
}
