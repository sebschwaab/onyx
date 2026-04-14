import type { UserGroup } from "@/lib/types";

/** Whether this group is a system default group (Admin, Basic). */
export function isBuiltInGroup(group: UserGroup): boolean {
  return group.is_default;
}

/** Human-readable description for built-in groups. */
const BUILT_IN_DESCRIPTIONS: Record<string, string> = {
  Basic: "Groupe par défaut pour tous les utilisateurs avec des permissions de base.",
  Admin: "Groupe administrateur intégré avec accès complet à la gestion des permissions.",
};

/**
 * Build the description line(s) shown beneath the group name.
 *
 * Built-in groups use a fixed label.
 * Custom groups list resource counts ("3 connectors · 2 document sets · 2 agents")
 * or fall back to "No private connectors / document sets / agents".
 */
export function buildGroupDescription(group: UserGroup): string {
  if (isBuiltInGroup(group)) {
    return BUILT_IN_DESCRIPTIONS[group.name] ?? "";
  }

  const parts: string[] = [];
  if (group.cc_pairs.length > 0) {
    parts.push(
      `${group.cc_pairs.length} connecteur${
        group.cc_pairs.length !== 1 ? "s" : ""
      }`
    );
  }
  if (group.document_sets.length > 0) {
    parts.push(
      `${group.document_sets.length} ensemble${
        group.document_sets.length !== 1 ? "s" : ""
      } de documents`
    );
  }
  if (group.personas.length > 0) {
    parts.push(
      `${group.personas.length} agent${group.personas.length !== 1 ? "s" : ""}`
    );
  }

  return parts.length > 0
    ? parts.join(" · ")
    : "Aucun connecteur / ensemble de documents / agent privé";
}

/** Format the member count badge, e.g. "306 Members" or "1 Member". */
export function formatMemberCount(count: number): string {
  return `${count} ${count === 1 ? "Membre" : "Membres"}`;
}
