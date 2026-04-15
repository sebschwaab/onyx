"use client";

import * as SettingsLayouts from "@/layouts/settings-layouts";
import OpenApiPageContent from "@/sections/actions/OpenApiPageContent";
import { ADMIN_ROUTES } from "@/lib/admin-routes";

const route = ADMIN_ROUTES.OPENAPI_ACTIONS;

export default function Main() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title={route.title}
        description="Connectez des serveurs OpenAPI pour ajouter des actions et outils personnalisés à vos agents."
        separator
      />
      <SettingsLayouts.Body>
        <OpenApiPageContent />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
