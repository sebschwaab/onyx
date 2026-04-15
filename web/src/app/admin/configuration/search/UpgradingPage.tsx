import { ThreeDotsLoader } from "@/components/Loading";
import Modal from "@/refresh-components/Modal";
import { errorHandlingFetcher } from "@/lib/fetcher";
import {
  ConnectorIndexingStatusLite,
  ConnectorIndexingStatusLiteResponse,
  FailedConnectorIndexingStatus,
  ValidStatuses,
} from "@/lib/types";
import { Text } from "@opal/components";
import { markdown } from "@opal/utils";
import Spacer from "@/refresh-components/Spacer";
import Title from "@/components/ui/title";
import Button from "@/refresh-components/buttons/Button";
import { Button as OpalButton } from "@opal/components";
import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { SWR_KEYS } from "@/lib/swr-keys";
import { ReindexingProgressTable } from "../../../../components/embedding/ReindexingProgressTable";
import { ErrorCallout } from "@/components/ErrorCallout";
import {
  CloudEmbeddingModel,
  HostedEmbeddingModel,
} from "../../../../components/embedding/interfaces";
import { Connector } from "@/lib/connectors/connectors";
import { FailedReIndexAttempts } from "@/components/embedding/FailedReIndexAttempts";
import { useConnectorIndexingStatusWithPagination } from "@/lib/hooks";
import { SvgX } from "@opal/icons";
import { ConnectorCredentialPairStatus } from "@/app/admin/connector/[ccPairId]/types";
import { useVectorDbEnabled } from "@/providers/SettingsProvider";

export default function UpgradingPage({
  futureEmbeddingModel,
}: {
  futureEmbeddingModel: CloudEmbeddingModel | HostedEmbeddingModel;
}) {
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const vectorDbEnabled = useVectorDbEnabled();

  const { data: connectors, isLoading: isLoadingConnectors } = useSWR<
    Connector<any>[]
  >(vectorDbEnabled ? SWR_KEYS.connector : null, errorHandlingFetcher, {
    refreshInterval: 5000,
  });

  const {
    data: connectorIndexingStatuses,
    isLoading: isLoadingOngoingReIndexingStatus,
  } = useConnectorIndexingStatusWithPagination(
    { secondary_index: true, get_all_connectors: true },
    5000,
    vectorDbEnabled
  ) as {
    data: ConnectorIndexingStatusLiteResponse[];
    isLoading: boolean;
  };

  const { data: failedIndexingStatus } = useSWR<
    FailedConnectorIndexingStatus[]
  >(
    vectorDbEnabled
      ? "/api/manage/admin/connector/failed-indexing-status?secondary_index=true"
      : null,
    errorHandlingFetcher,
    { refreshInterval: 5000 }
  );

  const onCancel = async () => {
    const response = await fetch("/api/search-settings/cancel-new-embedding", {
      method: "POST",
    });
    if (response.ok) {
      mutate(SWR_KEYS.secondarySearchSettings);
    } else {
      alert(
        `Failed to cancel embedding model update - ${await response.text()}`
      );
    }
    setIsCancelling(false);
  };
  const statusOrder: Record<ValidStatuses, number> = useMemo(
    () => ({
      invalid: 0,
      failed: 1,
      canceled: 2,
      completed_with_errors: 3,
      not_started: 4,
      in_progress: 5,
      success: 6,
    }),
    []
  );

  const ongoingReIndexingStatus = useMemo(() => {
    return connectorIndexingStatuses
      .flatMap(
        (status) => status.indexing_statuses as ConnectorIndexingStatusLite[]
      )
      .filter((status) => status.cc_pair_id !== undefined);
  }, [connectorIndexingStatuses]);

  const visibleReindexingStatus = useMemo(() => {
    const statuses = ongoingReIndexingStatus || [];

    if (futureEmbeddingModel.switchover_type === "active_only") {
      return statuses.filter(
        (status) =>
          status.cc_pair_status !== ConnectorCredentialPairStatus.PAUSED
      );
    }

    return statuses;
  }, [futureEmbeddingModel.switchover_type, ongoingReIndexingStatus]);

  const sortedReindexingProgress = useMemo(() => {
    return [...(visibleReindexingStatus || [])].sort((a, b) => {
      const statusComparison =
        statusOrder[a.last_status || "not_started"] -
        statusOrder[b.last_status || "not_started"];

      if (statusComparison !== 0) {
        return statusComparison;
      }

      return (a.cc_pair_id || 0) - (b.cc_pair_id || 0);
    });
  }, [visibleReindexingStatus, statusOrder]);

  const hasVisibleReindexingProgress = sortedReindexingProgress.length > 0;

  if (isLoadingConnectors || isLoadingOngoingReIndexingStatus) {
    return <ThreeDotsLoader />;
  }

  return (
    <>
      {isCancelling && (
        <Modal open onOpenChange={() => setIsCancelling(false)}>
          <Modal.Content width="sm" height="sm">
            <Modal.Header
              icon={SvgX}
              title="Annuler le changement de modèle d'embedding"
              onClose={() => setIsCancelling(false)}
            />
            <Modal.Body>
              <div>
                Êtes-vous sûr de vouloir annuler ? L&apos;annulation reviendra au modèle précédent et toute la progression sera perdue.
              </div>
            </Modal.Body>
            <Modal.Footer>
              <OpalButton onClick={onCancel}>Confirmer</OpalButton>
              <OpalButton
                prominence="secondary"
                onClick={() => setIsCancelling(false)}
              >
                Annuler
              </OpalButton>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      )}

      {futureEmbeddingModel && (
        <div>
          <Title className="mt-8">Current Upgrade Status</Title>
          <div className="mt-4">
            <div className="italic text-lg mb-2">
              Currently in the process of switching to:{" "}
              {futureEmbeddingModel.model_name}
            </div>

            {/* TODO(@raunakab): migrate to opal Button once className/iconClassName is resolved */}
            <Button
              danger
              className="mt-4"
              onClick={() => setIsCancelling(true)}
            >
              Cancel
            </Button>

            {connectors && connectors.length > 0 ? (
              futureEmbeddingModel.switchover_type === "instant" ? (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-2">
                    Switching Embedding Models
                  </h3>
                  <p className="mb-4 text-text-800">
                    You&apos;re currently switching embedding models, and
                    you&apos;ve selected the instant switch option. The
                    transition will complete shortly.
                  </p>
                  <p className="text-text-600">
                    The new model will be active soon.
                  </p>
                </div>
              ) : (
                <>
                  {failedIndexingStatus && failedIndexingStatus.length > 0 && (
                    <FailedReIndexAttempts
                      failedIndexingStatuses={failedIndexingStatus}
                    />
                  )}

                  <Spacer rem={1} />
                  <Text as="p">
                    {futureEmbeddingModel.switchover_type === "active_only"
                      ? markdown(
                          "Le tableau ci-dessous montre la progression de la réindexation des connecteurs actifs (non mis en pause). Une fois tous les connecteurs actifs réindexés avec succès, le nouveau modèle sera utilisé pour toutes les requêtes de recherche. Les connecteurs mis en pause continueront d'être indexés en arrière-plan mais ne bloqueront pas le basculement. En attendant, nous utiliserons l'ancien modèle pour qu'aucune interruption de service ne soit nécessaire pendant cette transition.\nRemarque : La progression de la réindexation des fichiers utilisateurs n'est pas affichée. Vous verrez cette page jusqu'à ce que tous les connecteurs actifs soient réindexés !"
                        )
                      : markdown(
                          "Le tableau ci-dessous montre la progression de la réindexation de tous les connecteurs existants. Une fois tous les connecteurs réindexés avec succès, le nouveau modèle sera utilisé pour toutes les requêtes de recherche. En attendant, nous utiliserons l'ancien modèle pour qu'aucune interruption de service ne soit nécessaire pendant cette transition.\nRemarque : La progression de la réindexation des fichiers utilisateurs n'est pas affichée. Vous verrez cette page jusqu'à ce que tous les fichiers utilisateurs soient réindexés !"
                        )}
                  </Text>
                  <Spacer rem={1} />

                  {sortedReindexingProgress ? (
                    <>
                      {futureEmbeddingModel.switchover_type === "active_only" &&
                        !hasVisibleReindexingProgress && (
                          <>
                            <Spacer rem={1} />
                            <Text as="p">
                              Tous les connecteurs sont actuellement mis en pause, aucun ne bloque donc le basculement. Les connecteurs mis en pause continueront de se réindexer en arrière-plan.
                            </Text>
                          </>
                        )}
                      {hasVisibleReindexingProgress && (
                        <ReindexingProgressTable
                          reindexingProgress={sortedReindexingProgress}
                        />
                      )}
                    </>
                  ) : (
                    <ErrorCallout errorTitle="Impossible de récupérer la progression de la réindexation" />
                  )}
                </>
              )
            ) : (
              <div className="mt-8 p-6 bg-background-100 border border-border-strong rounded-lg max-w-2xl">
                <h3 className="text-lg font-semibold mb-2">
                  Switching Embedding Models
                </h3>
                <p className="mb-4 text-text-800">
                  You&apos;re currently switching embedding models, but there
                  are no connectors to reindex. This means the transition will
                  be quick and seamless!
                </p>
                <p className="text-text-600">
                  The new model will be active soon.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
