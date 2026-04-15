"use client";

import MCPPageContent from "@/sections/actions/MCPPageContent";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { ADMIN_ROUTES } from "@/lib/admin-routes";

const route = ADMIN_ROUTES.MCP_ACTIONS;

export default function Main() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title={route.title}
        description="Connectez des serveurs MCP (Model Context Protocol) pour ajouter des actions et outils personnalisés à vos agents."
        separator
      />
      <SettingsLayouts.Body>
        <MCPPageContent />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
