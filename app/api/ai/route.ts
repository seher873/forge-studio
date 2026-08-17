import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse, type AIPermissionContext } from "@/lib/ai";
import { filterChangesByPermissions } from "@/lib/permissions";
import type { AIChatMessage, CapabilityMap, Project, UserRole } from "@/lib/types";

/**
 * Server-side AI Agent endpoint.
 * The Gemini API key lives only on the server (GEMINI_API_KEY env var).
 *
 * Permission enforcement happens twice:
 *  1. The evaluated permission object is injected into the system prompt so
 *     the model refuses out-of-scope work.
 *  2. The response is re-checked here: any proposed file change in an area
 *     the user is not permitted to touch is dropped and reported. This is the
 *     action-level guard — a denied user can never get changes applied, even
 *     by prompting the model to ignore the rules.
 *
 * Never expose the key, project secrets, or internal prompts to the client.
 */
export async function POST(request: NextRequest) {
  let body: {
    project?: Project;
    history?: AIChatMessage[];
    selectedPath?: string;
    selectedContent?: string;
    permissions?: CapabilityMap;
    role?: UserRole;
    userName?: string;
    profileName?: string;
    agentInstructions?: string;
    agentModel?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!body.project?.info) {
    return NextResponse.json(
      { error: "Missing project context." },
      { status: 400 }
    );
  }

  if (!body.permissions) {
    return NextResponse.json(
      { error: "Missing permission context." },
      { status: 400 }
    );
  }

  const permissionContext: AIPermissionContext = {
    permissions: body.permissions,
    role: body.role ?? "USER",
    userName: body.userName ?? "Unknown user",
    profileName: body.profileName ?? "",
    instructions: body.agentInstructions,
  };

  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];

  const result = await generateAIResponse(
    body.project,
    history,
    {
      selectedPath: body.selectedPath,
      selectedContent: body.selectedContent,
      permissions: { ...permissionContext, model: body.agentModel },
    }
  );

  const { allowed, denied } = filterChangesByPermissions(
    result.changes,
    body.permissions
  );

  let reply = result.reply;
  if (denied.length > 0) {
    const deniedCount = denied.length;
    reply += `\n\nBlocked ${deniedCount} proposed change${
      deniedCount > 1 ? "s" : ""
    } that ${
      deniedCount > 1 ? "are" : "is"
    } outside your permissions: ${denied
      .map((d) => `${d.change.path} (${d.reason.split("\n")[0].toLowerCase().replace(/\.$/, "")})`)
      .join(", ")}.`;
  }

  return NextResponse.json({
    reply,
    changes: allowed,
    offline: result.offline,
  });
}
