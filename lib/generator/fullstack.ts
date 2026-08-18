import type {
  CapabilityMap,
  GeneratedFile,
  ProjectInfo,
  ProjectMode,
  SiteModel,
} from "@/lib/types";

/**
 * Deterministic full-stack scaffolding for privileged projects.
 *
 * Each file is emitted only when the required capability is enabled, and
 * every file maps to a path area (backend / api / database / auth) that the
 * permission guard enforces. No secrets are ever written into these files —
 * secrets stay in the environment (e.g. .env.example).
 */

export interface FullStackOptions {
  mode: ProjectMode;
  capabilities: CapabilityMap;
  info: ProjectInfo;
  model: SiteModel;
}

export function renderFullStackFiles(options: FullStackOptions): Record<string, GeneratedFile> {
  if (options.mode === "frontend") return {};

  const files: Record<string, GeneratedFile> = {};
  const add = (path: string, content: string, language: string) => {
    files[path] = { path, content, language };
  };

  const cap = options.capabilities;

  if (cap.backend) add("lib/server/env.ts", envFile(), "typescript");
  if (cap.api) add("app/api/health/route.ts", healthFile(), "typescript");
  if (cap.database) add("lib/db.ts", dbFile(), "typescript");
  if (cap.api && cap.database) add("app/api/contact/route.ts", contactFile(), "typescript");
  if (cap.auth) add("lib/auth.ts", authFile(), "typescript");
  if (cap.auth && cap.api && cap.database) {
    add("app/api/register/route.ts", registerFile(), "typescript");
    add("app/api/login/route.ts", loginFile(), "typescript");
  }
  if (cap.auth) add("middleware.ts", middlewareFile(), "typescript");

  if (cap.api && cap.database) add("app/api/orders/route.ts", ordersFile(), "typescript");
  if (cap.backend && cap.api) {
    add("app/api/payments/stripe/route.ts", paymentStripeFile(), "typescript");
    add("app/api/payments/paypal/route.ts", paymentPaypalFile(), "typescript");
    add("app/api/payments/jazzcash/route.ts", paymentJazzcashFile(), "typescript");
  }
  if (cap.backend) add(".env.example", envExampleFile(), "plaintext");

  return files;
}

function healthFile(): string {
  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "forge-studio",
    time: new Date().toISOString(),
  });
}

export const dynamic = "force-dynamic";
`;
}

function envFile(): string {
  return `// Server-only environment helpers.
// This module must never be imported from a client component ("use client")
// or from a module that runs in the browser.

const SERVER_ONLY_PREFIX = "SERVER_";

export function isServer(): boolean {
  return typeof window === "undefined";
}

export function serverEnv(key: string, fallback = ""): string {
  if (!isServer()) {
    throw new Error(
      \`serverEnv("\${key}") was called from the browser. Server secrets must never reach the client.\`
    );
  }
  return process.env[key] ?? fallback;
}

export function hasServerEnv(key: string): boolean {
  return isServer() && typeof process.env[key] === "string";
}
`;
}

function dbFile(): string {
  return `// Lightweight typed data store used by the generated API routes.
//
// This is a dependency-free placeholder so the demo works out of the box.
// Swap the underlying store for the database technology approved for this
// project (e.g. PostgreSQL + Prisma) without changing the route handlers.

type Row = Record<string, string>;

const memory = new Map<string, Row[]>();

function table(name: string): Row[] {
  if (!memory.has(name)) memory.set(name, []);
  return memory.get(name)!;
}

export function insert(tableName: string, row: Row): Row {
  const record: Row = {
    ...row,
    ...(row.id ? {} : { id: crypto.randomUUID() }),
    ...(row.createdAt ? {} : { createdAt: new Date().toISOString() }),
  };
  table(tableName).push(record);
  return record;
}

export function all(tableName: string): Row[] {
  return table(tableName);
}

export function find(tableName: string, predicate: (row: Row) => boolean): Row | undefined {
  return table(tableName).find(predicate);
}

export function clear(tableName: string): void {
  memory.delete(tableName);
}
`;
}

function contactFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { insert } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email and message are required." },
      { status: 400 }
    );
  }

  insert("contacts", { name, email, message });
  return NextResponse.json({ ok: true, message: "Message received." });
}

export const dynamic = "force-dynamic";
`;
}

function authFile(): string {
  return `// Minimal signed session-token helpers built on the Web Crypto API
// (available in Edge middleware and Node 18+ route handlers).
// Swap for your approved authentication provider when required.

import { NextResponse } from "next/server";

const COOKIE = "forge_session";
const SECRET_BYTES = 32;

function encode(value: string): ArrayBuffer {
  return new TextEncoder().encode(value).buffer as ArrayBuffer;
}

function secretBytes(): ArrayBuffer {
  const raw = (process.env.AUTH_SECRET ?? "dev-only-change-me").padEnd(
    SECRET_BYTES,
    "0"
  );
  return encode(raw.slice(0, SECRET_BYTES)).slice(0, SECRET_BYTES);
}

async function key(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    secretBytes(),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  new Uint8Array(bytes).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function signSession(payload: Record<string, string>): Promise<string> {
  const body = btoa(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", await key(), encode(body));
  return \`\${body}.\${toBase64Url(signature)}\`;
}

export async function verifySession(token: string | null | undefined): Promise<Record<string, string> | null> {
  if (!token) return null;
  const [body, signaturePart] = token.split(".");
  if (!body || !signaturePart) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await key(),
    fromBase64Url(signaturePart).buffer as ArrayBuffer,
    encode(body)
  );
  if (!valid) return null;

  try {
    return JSON.parse(atob(body)) as Record<string, string>;
  } catch {
    return null;
  }
}

export function withSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function readSession(
  request: { cookies: { get(name: string): { value?: string } | undefined } }
): string | null {
  return request.cookies.get(COOKIE)?.value ?? null;
}
`;
}

function registerFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { all, insert } from "@/lib/db";
import { signSession, withSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: "A valid email and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  if (all("users").some((u) => u.email === email)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  insert("users", { email, password: hash(password) });
  const token = await signSession({ email, uid: crypto.randomUUID() });
  return withSessionCookie(NextResponse.json({ ok: true, email }), token);
}

// Demo-only hashing. Replace with a real password-hashing library in production.
function hash(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export const dynamic = "force-dynamic";
`;
}

function loginFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { find } from "@/lib/db";
import { signSession, withSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const user = find("users", (u) => u.email === email && u.password === hash(password));
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = await signSession({ email, uid: crypto.randomUUID() });
  return withSessionCookie(NextResponse.json({ ok: true, email }), token);
}

// Demo-only hashing. Replace with a real password-hashing library in production.
function hash(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export const dynamic = "force-dynamic";
`;
}

function middlewareFile(): string {
  return `import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = ["/api/account", "/account"].some((prefix) =>
    path.startsWith(prefix)
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("forge_session")?.value;
  const session = await verifySession(token);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/account/:path*", "/account/:path*"],
};
`;
}

function ordersFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { find, insert } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const customer = body?.customer;
  const items = body?.items;
  const method = typeof body?.method === "string" ? body.method : "cod";
  const total = Number(body?.total ?? 0);

  if (
    !customer?.name ||
    !customer?.email ||
    !customer?.phone ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return NextResponse.json(
      { error: "Customer details and at least one item are required." },
      { status: 400 }
    );
  }

  const order = insert("orders", {
    id: "FORGE-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    status: "placed",
    method,
    total: String(total),
    customer: JSON.stringify(customer),
    items: JSON.stringify(items),
  });

  return NextResponse.json({ ok: true, order: toOrderJson(order) });
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const order = find("orders", (o) => o.id === orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: toOrderJson(order) });
}

function toOrderJson(row: Record<string, string>) {
  return {
    id: row.id,
    status: row.status,
    method: row.method,
    total: Number(row.total),
    createdAt: row.createdAt,
    customer: JSON.parse(row.customer || "{}"),
    items: JSON.parse(row.items || "[]"),
  };
}

export const dynamic = "force-dynamic";
`;
}

function paymentStripeFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { hasServerEnv, serverEnv } from "@/lib/server/env";

const STRIPE_API = "https://api.stripe.com/v1";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  const currency = typeof body?.currency === "string" ? body.currency.toLowerCase() : "usd";
  const total = Math.round(Number(body?.total ?? 0) * 100);

  if (!hasServerEnv("STRIPE_SECRET_KEY")) {
    return NextResponse.json({
      demo: true,
      message: "STRIPE_SECRET_KEY is not configured, so the checkout will continue in demo mode.",
    });
  }

  const params = new URLSearchParams({
    mode: "payment",
    success_url: request.nextUrl.origin + "/checkout?success=1",
    cancel_url: request.nextUrl.origin + "/checkout?cancel=1",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": currency,
    "line_items[0][price_data][unit_amount]": String(Math.max(50, total)),
    "line_items[0][price_data][product_data][name]": items[0]?.name ?? "Order",
  });

  const res = await fetch(STRIPE_API + "/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + serverEnv("STRIPE_SECRET_KEY"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.message ?? "Stripe checkout could not be created." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: data.url });
}

export const dynamic = "force-dynamic";
`;
}

function paymentPaypalFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { hasServerEnv, serverEnv } from "@/lib/server/env";

const PAYPAL_API = "https://api-m.paypal.com";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const currency = typeof body?.currency === "string" ? body.currency.toUpperCase() : "USD";
  const total = Number(body?.total ?? 0);

  const clientId = serverEnv("PAYPAL_CLIENT_ID");
  const clientSecret = serverEnv("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      demo: true,
      message: "PayPal credentials are not configured, so the checkout will continue in demo mode.",
    });
  }

  const tokenRes = await fetch(PAYPAL_API + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  const accessToken = tokenData.access_token;
  if (!accessToken) {
    return NextResponse.json(
      { error: "PayPal authentication failed. Check your credentials." },
      { status: 502 }
    );
  }

  const orderRes = await fetch(PAYPAL_API + "/v2/checkout/orders", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: Math.max(1, total).toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: request.nextUrl.origin + "/checkout?success=1",
        cancel_url: request.nextUrl.origin + "/checkout?cancel=1",
        user_action: "PAY_NOW",
      },
    }),
  });
  const orderData = await orderRes.json().catch(() => ({}));

  if (!orderRes.ok) {
    return NextResponse.json(
      { error: orderData?.message ?? "PayPal order could not be created." },
      { status: 502 }
    );
  }

  const approve = (orderData.links ?? []).find((l: { rel?: string }) => l.rel === "approve");
  return NextResponse.json({ url: approve?.href });
}

export const dynamic = "force-dynamic";
`;
}

function paymentJazzcashFile(): string {
  return `import { NextRequest, NextResponse } from "next/server";
import { hasServerEnv, serverEnv } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const total = Number(body?.total ?? 0);

  if (!hasServerEnv("JAZZCASH_MERCHANT_ID")) {
    return NextResponse.json({
      demo: true,
      instructions:
        "Send the order total to our JazzCash account, then confirm below. We will confirm your order manually.",
    });
  }

  const merchant = serverEnv("JAZZCASH_MERCHANT_ID");
  return NextResponse.json({
    demo: true,
    instructions: \`Send the order total to JazzCash merchant \${merchant}, then confirm below. We will confirm your order manually.\`,
  });
}

export const dynamic = "force-dynamic";
`;
}

function envExampleFile(): string {
  return `# Server environment variables for the generated full-stack site.
# Copy this file to .env.local and fill in real values before going live.
# Server secrets are read only inside API route handlers — never the browser.

# Authentication (used by the register/login flow)
AUTH_SECRET=

# Payments (optional — leave empty to run the site in demo mode)
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
JAZZCASH_MERCHANT_ID=
JAZZCASH_MERCHANT_PASSWORD=
JAZZCASH_SECRET_KEY=
EASYPAISA_ACCOUNT=
`;
}
