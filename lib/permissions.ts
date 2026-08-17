import type {
  AIProposedChange,
  Capability,
  CapabilityMap,
  PermissionProfile,
  PlatformUser,
  UserRole,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Capability catalogue                                                */
/* ------------------------------------------------------------------ */

export const CAPABILITIES: Capability[] = [
  "generation",
  "frontend",
  "backend",
  "api",
  "database",
  "auth",
  "ai_agent",
  "code_editor",
  "terminal",
  "packages",
  "zip_export",
  "deployment",
  "user_management",
];

export const CAPABILITY_META: Record<Capability, { label: string; description: string }> = {
  generation: { label: "Website generation", description: "Generate and regenerate projects from a brief." },
  frontend: { label: "Frontend", description: "React, Next.js, TypeScript, Tailwind UI work." },
  backend: { label: "Backend", description: "Server-side services and route handlers." },
  api: { label: "APIs", description: "Create and edit API endpoints." },
  database: { label: "Database", description: "Databases, schemas, migrations and ORM config." },
  auth: { label: "Authentication", description: "Login, signup, sessions and auth providers." },
  ai_agent: { label: "AI Agent", description: "Chat with and apply changes from the AI agent." },
  code_editor: { label: "Code editor", description: "Open, edit and save project files." },
  terminal: { label: "Terminal", description: "Run commands in the workspace terminal." },
  packages: { label: "Package installation", description: "Install npm packages and dependencies." },
  zip_export: { label: "ZIP export", description: "Download the project as a ZIP archive." },
  deployment: { label: "Deployment", description: "Deploy the generated project." },
  user_management: { label: "User management", description: "Create users and manage permissions." },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  MASTER_ADMIN: "Master Admin",
  ADMIN: "Admin",
  USER: "User",
  CLIENT: "Client",
};

/* ------------------------------------------------------------------ */
/* Capability map helpers                                              */
/* ------------------------------------------------------------------ */

export function allCapabilities(value: boolean): CapabilityMap {
  const map = {} as CapabilityMap;
  for (const cap of CAPABILITIES) map[cap] = value;
  return map;
}

export function roleDefaultCapabilities(role: UserRole): CapabilityMap {
  switch (role) {
    case "MASTER_ADMIN":
      return allCapabilities(true);
    case "ADMIN":
      return { ...allCapabilities(true), user_management: false };
    case "USER":
      return {
        generation: true,
        frontend: true,
        backend: false,
        api: false,
        database: false,
        auth: false,
        ai_agent: true,
        code_editor: true,
        terminal: false,
        packages: false,
        zip_export: true,
        deployment: false,
        user_management: false,
      };
    case "CLIENT":
      return {
        generation: true,
        frontend: true,
        backend: false,
        api: false,
        database: false,
        auth: false,
        ai_agent: false,
        code_editor: false,
        terminal: false,
        packages: false,
        zip_export: false,
        deployment: false,
        user_management: false,
      };
  }
}

/* ------------------------------------------------------------------ */
/* Built-in permission profiles                                        */
/* ------------------------------------------------------------------ */

export function builtinProfiles(): PermissionProfile[] {
  const def = (
    id: string,
    name: string,
    description: string,
    enabled: Capability[]
  ): PermissionProfile => {
    const map = allCapabilities(false);
    for (const cap of enabled) map[cap] = true;
    return { id, name, description, capabilities: map, builtin: true };
  };

  return [
    def(
      "frontend-only",
      "Frontend Only",
      "Frontend, AI agent, code editing and ZIP export. No backend, database, API, terminal or packages.",
      ["generation", "frontend", "ai_agent", "code_editor", "zip_export"]
    ),
    def(
      "full-stack",
      "Full Stack",
      "Frontend + backend, APIs, database, authentication, terminal, packages, deployment and ZIP export.",
      [
        "generation",
        "frontend",
        "backend",
        "api",
        "database",
        "auth",
        "ai_agent",
        "code_editor",
        "terminal",
        "packages",
        "zip_export",
        "deployment",
      ]
    ),
    def(
      "student",
      "Student",
      "Learn frontend development with the AI agent and code editor. Terminal and packages stay locked.",
      ["generation", "frontend", "ai_agent", "code_editor", "zip_export"]
    ),
    def(
      "client",
      "Client",
      "Request a generated website only. No code editor, no AI agent, no terminal, no ZIP export.",
      ["generation", "frontend"]
    ),
    def(
      "custom",
      "Custom",
      "Start empty and enable exactly the capabilities this user should have.",
      []
    ),
  ];
}

/* ------------------------------------------------------------------ */
/* Permission evaluation                                               */
/* ------------------------------------------------------------------ */

export function findProfile(
  profiles: PermissionProfile[],
  profileId: string
): PermissionProfile | undefined {
  return profiles.find((p) => p.id === profileId);
}

/**
 * Resolves the effective capability set for a user.
 *
 * MASTER_ADMIN always bypasses normal user-level permissions and receives
 * every capability. Everyone else is evaluated from their role defaults,
 * their assigned profile and their per-user overrides (overrides win).
 */
export function resolveUserPermissions(
  user: PlatformUser | undefined,
  profiles: PermissionProfile[]
): CapabilityMap {
  if (!user) return allCapabilities(false);
  if (user.role === "MASTER_ADMIN") return allCapabilities(true);

  const profile = findProfile(profiles, user.profileId);
  const base = profile?.capabilities ?? roleDefaultCapabilities(user.role);
  return { ...base, ...user.overrides };
}

export function canUse(
  user: PlatformUser | undefined,
  profiles: PermissionProfile[],
  capability: Capability
): boolean {
  return resolveUserPermissions(user, profiles)[capability];
}

export function deniedMessage(capability: Capability): string {
  return `Permission denied.\n\n${CAPABILITY_META[capability].label} is disabled for your current account.\nPlease contact the Master Admin.`;
}

/* ------------------------------------------------------------------ */
/* AI action-level guard                                               */
/* ------------------------------------------------------------------ */

export type PathArea = "frontend" | "backend" | "api" | "database" | "auth";

export function classifyPath(path: string): PathArea {
  const p = path.toLowerCase();
  if (p.includes("/api/")) return "api";
  if (
    p.startsWith("lib/db") ||
    p.startsWith("prisma/") ||
    p.startsWith("db/") ||
    p.startsWith("drizzle") ||
    p.startsWith("src/db") ||
    p.includes("migration")
  )
    return "database";
  if (
    p.startsWith("lib/auth") ||
    p.startsWith("middleware") ||
    p.startsWith("app/(auth)") ||
    p.startsWith("app/login") ||
    p.startsWith("app/signup") ||
    p.startsWith("app/logout") ||
    p.includes("session")
  )
    return "auth";
  if (
    p.startsWith("server/") ||
    p.startsWith("src/server") ||
    p.startsWith("lib/server") ||
    p.endsWith("server.ts") ||
    p.endsWith("server.js")
  )
    return "backend";
  return "frontend";
}

export function areaCapability(area: PathArea): Capability {
  switch (area) {
    case "backend":
      return "backend";
    case "api":
      return "api";
    case "database":
      return "database";
    case "auth":
      return "auth";
    case "frontend":
      return "frontend";
  }
}

export interface ChangeVerdict {
  allowed: AIProposedChange[];
  denied: { change: AIProposedChange; reason: string }[];
}

/**
 * Action-level permission enforcement for AI-proposed file changes.
 * Changes to files in an area the user does not have permission for are
 * dropped — even if the model already produced them.
 */
export function filterChangesByPermissions(
  changes: AIProposedChange[],
  permissions: CapabilityMap
): ChangeVerdict {
  const allowed: AIProposedChange[] = [];
  const denied: { change: AIProposedChange; reason: string }[] = [];

  for (const change of changes) {
    const cap = areaCapability(classifyPath(change.path));
    if (permissions[cap]) {
      allowed.push(change);
    } else {
      denied.push({ change, reason: deniedMessage(cap) });
    }
  }

  return { allowed, denied };
}

export function areaLabel(area: PathArea): string {
  return CAPABILITY_META[areaCapability(area)].label;
}
