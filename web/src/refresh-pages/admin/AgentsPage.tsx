"use client";

import { SvgOnyxOctagon, SvgPlus } from "@opal/icons";
import { Button } from "@opal/components";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import Link from "next/link";

import AgentsTable from "./AgentsPage/AgentsTable";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        title="Agents"
        description="Personnalisez le comportement de l'IA et ses connaissances avec des agents. Gérez les agents de votre organisation."
        icon={SvgOnyxOctagon}
        rightChildren={
          <Button href="/app/agents/create?admin=true" icon={SvgPlus}>
            Nouvel agent
          </Button>
        }
      />
      <SettingsLayouts.Body>
        <AgentsTable />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
