"use client";

import { useProjects } from "@/lib/store";
import { canUse, resolveUserPermissions } from "@/lib/permissions";
import type { Capability, CapabilityMap } from "@/lib/types";

export function usePermissions(): CapabilityMap {
  const { activeUser, profiles } = useProjects();
  return resolveUserPermissions(activeUser, profiles);
}

export function useCan(capability: Capability): boolean {
  const { activeUser, profiles } = useProjects();
  return canUse(activeUser, profiles, capability);
}
