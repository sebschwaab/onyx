"use client";

import { useState } from "react";
import useSWR from "swr";
import { SWR_KEYS } from "@/lib/swr-keys";
import * as SettingsLayouts from "@/layouts/settings-layouts";
import { ADMIN_ROUTES } from "@/lib/admin-routes";

const route = ADMIN_ROUTES.INDEX_MIGRATION;

import Card from "@/refresh-components/cards/Card";
import { Content, ContentAction } from "@opal/layouts";
import Text from "@/refresh-components/texts/Text";
import InputSelect from "@/refresh-components/inputs/InputSelect";
import Button from "@/refresh-components/buttons/Button";
import { errorHandlingFetcher } from "@/lib/fetcher";

interface MigrationStatus {
  total_chunks_migrated: number;
  created_at: string | null;
  migration_completed_at: string | null;
  approx_chunk_count_in_vespa: number | null;
}

interface RetrievalStatus {
  enable_opensearch_retrieval: boolean;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

function MigrationStatusSection() {
  const { data, isLoading, error } = useSWR<MigrationStatus>(
    SWR_KEYS.opensearchMigrationStatus,
    errorHandlingFetcher
  );

  if (isLoading) {
    return (
      <Card>
        <Text headingH3>Statut de la migration</Text>
        <Text mainUiBody text03>
          Chargement...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text headingH3>Statut de la migration</Text>
        <Text mainUiBody text03>
          Impossible de charger le statut de la migration.
        </Text>
      </Card>
    );
  }

  const hasStarted = data?.created_at != null;
  const hasCompleted = data?.migration_completed_at != null;
  const isOngoing = hasStarted && !hasCompleted;

  const totalChunksMigrated = data?.total_chunks_migrated ?? 0;
  const approxTotalChunks = data?.approx_chunk_count_in_vespa;

  // Calculate percentage progress if migration is ongoing and we have approx
  // total chunks.
  const shouldShowProgress = isOngoing && approxTotalChunks;
  const progressPercentage = shouldShowProgress
    ? Math.min(99, (totalChunksMigrated / approxTotalChunks) * 100)
    : null;

  return (
    <Card>
      <Text headingH3>Statut de la migration</Text>

      <ContentAction
        title="Démarré"
        sizePreset="main-ui"
        variant="section"
        rightChildren={
          <Text mainUiBody>
            {hasStarted ? formatTimestamp(data.created_at!) : "Pas encore démarré"}
          </Text>
        }
      />

      <ContentAction
        title="Chunks migrés"
        sizePreset="main-ui"
        variant="section"
        rightChildren={
          <Text mainUiBody>
            {progressPercentage !== null
              ? `${totalChunksMigrated} (progression approx. ${Math.round(
                  progressPercentage
                )}%)`
              : String(totalChunksMigrated)}
          </Text>
        }
      />

      <ContentAction
        title="Terminé"
        sizePreset="main-ui"
        variant="section"
        rightChildren={
          <Text mainUiBody>
            {hasCompleted
              ? formatTimestamp(data.migration_completed_at!)
              : hasStarted
                ? "En cours"
                : "Pas encore démarré"}
          </Text>
        }
      />
    </Card>
  );
}

function RetrievalSourceSection() {
  const { data, isLoading, error, mutate } = useSWR<RetrievalStatus>(
    SWR_KEYS.opensearchMigrationRetrieval,
    errorHandlingFetcher
  );
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const serverValue = data?.enable_opensearch_retrieval
    ? "opensearch"
    : "vespa";
  const currentValue = selectedSource ?? serverValue;
  const hasChanges = selectedSource !== null && selectedSource !== serverValue;

  async function handleUpdate() {
    setUpdating(true);
    try {
      const response = await fetch(SWR_KEYS.opensearchMigrationRetrieval, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enable_opensearch_retrieval: currentValue === "opensearch",
        }),
      });
      if (!response.ok) {
        throw new Error("Impossible de mettre à jour le paramètre de récupération");
      }
      await mutate();
      setSelectedSource(null);
    } finally {
      setUpdating(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <Text headingH3>Source de récupération</Text>
        <Text mainUiBody text03>
          Chargement...
        </Text>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text headingH3>Source de récupération</Text>
        <Text mainUiBody text03>
          Impossible de charger les paramètres de récupération.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Content
        title="Source de récupération"
        description="Contrôle quel index de documents est utilisé pour la récupération."
        sizePreset="main-ui"
        variant="section"
      />

      <InputSelect
        value={currentValue}
        onValueChange={setSelectedSource}
        disabled={updating}
      >
        <InputSelect.Trigger placeholder="Sélectionner la source de récupération" />
        <InputSelect.Content>
          <InputSelect.Item value="vespa">Vespa</InputSelect.Item>
          <InputSelect.Item value="opensearch">OpenSearch</InputSelect.Item>
        </InputSelect.Content>
      </InputSelect>

      {hasChanges && (
        // TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved
        <Button
          className="self-center"
          onClick={handleUpdate}
          disabled={updating}
        >
          {updating ? "Mise à jour..." : "Mettre à jour les paramètres"}
        </Button>
      )}
    </Card>
  );
}

export default function Page() {
  return (
    <SettingsLayouts.Root>
      <SettingsLayouts.Header
        icon={route.icon}
        title={route.title}
        description="Surveillez la migration de Vespa vers OpenSearch et contrôlez la source de récupération active."
        separator
      />
      <SettingsLayouts.Body>
        <MigrationStatusSection />
        <RetrievalSourceSection />
      </SettingsLayouts.Body>
    </SettingsLayouts.Root>
  );
}
