"use client";

import { ValidStatuses } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/time";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiMinus,
  FiPauseCircle,
} from "react-icons/fi";
import {
  ConnectorCredentialPairStatus,
  PermissionSyncStatusEnum,
} from "@/app/admin/connector/[ccPairId]/types";
import SimpleTooltip from "@/refresh-components/SimpleTooltip";

export function IndexAttemptStatus({
  status,
  errorMsg,
}: {
  status: ValidStatuses | null;
  errorMsg?: string | null;
}) {
  let badge;

  if (status === "failed") {
    const icon = (
      <Badge variant="destructive" icon={FiAlertTriangle}>
        Échoué
      </Badge>
    );
    if (errorMsg) {
      badge = (
        <SimpleTooltip tooltip={errorMsg}>
          <div className="cursor-pointer">{icon}</div>
        </SimpleTooltip>
      );
    } else {
      badge = icon;
    }
  } else if (status === "completed_with_errors") {
    badge = (
      <Badge variant="secondary" icon={FiAlertTriangle}>
        Terminé avec des erreurs
      </Badge>
    );
  } else if (status === "success") {
    badge = (
      <Badge variant="success" icon={FiCheckCircle}>
        Réussi
      </Badge>
    );
  } else if (status === "in_progress") {
    badge = (
      <Badge variant="in_progress" icon={FiClock}>
        En cours
      </Badge>
    );
  } else if (status === "not_started") {
    badge = (
      <Badge variant="not_started" icon={FiClock}>
        Planifié
      </Badge>
    );
  } else if (status === "canceled") {
    badge = (
      <Badge variant="canceled" icon={FiClock}>
        Annulé
      </Badge>
    );
  } else if (status === "invalid") {
    badge = (
      <Badge variant="invalid" icon={FiAlertTriangle}>
        Invalide
      </Badge>
    );
  } else {
    badge = (
      <Badge variant="outline" icon={FiMinus}>
        Aucun
      </Badge>
    );
  }

  return <div>{badge}</div>;
}

export function PermissionSyncStatus({
  status,
  errorMsg,
}: {
  status: PermissionSyncStatusEnum | null;
  errorMsg?: string | null;
}) {
  let badge;

  if (status === PermissionSyncStatusEnum.FAILED) {
    const icon = (
      <Badge variant="destructive" icon={FiAlertTriangle}>
        Échoué
      </Badge>
    );
    if (errorMsg) {
      badge = (
        <SimpleTooltip tooltip={errorMsg} side="bottom">
          <div className="cursor-pointer">{icon}</div>
        </SimpleTooltip>
      );
    } else {
      badge = icon;
    }
  } else if (status === PermissionSyncStatusEnum.COMPLETED_WITH_ERRORS) {
    badge = (
      <Badge variant="secondary" icon={FiAlertTriangle}>
        Terminé avec des erreurs
      </Badge>
    );
  } else if (status === PermissionSyncStatusEnum.SUCCESS) {
    badge = (
      <Badge variant="success" icon={FiCheckCircle}>
        Réussi
      </Badge>
    );
  } else if (status === PermissionSyncStatusEnum.IN_PROGRESS) {
    badge = (
      <Badge variant="in_progress" icon={FiClock}>
        En cours
      </Badge>
    );
  } else if (status === PermissionSyncStatusEnum.NOT_STARTED) {
    badge = (
      <Badge variant="not_started" icon={FiClock}>
        Planifié
      </Badge>
    );
  } else {
    badge = (
      <Badge variant="secondary" icon={FiClock}>
        Non démarré
      </Badge>
    );
  }

  return <div>{badge}</div>;
}

export function CCPairStatus({
  ccPairStatus,
  inRepeatedErrorState,
  lastIndexAttemptStatus,
  size = "md",
}: {
  ccPairStatus: ConnectorCredentialPairStatus;
  inRepeatedErrorState: boolean;
  lastIndexAttemptStatus: ValidStatuses | undefined | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  let badge;

  if (ccPairStatus == ConnectorCredentialPairStatus.DELETING) {
    badge = (
      <Badge variant="destructive" icon={FiAlertTriangle}>
        Suppression
      </Badge>
    );
  } else if (ccPairStatus == ConnectorCredentialPairStatus.PAUSED) {
    badge = (
      <Badge variant="paused" icon={FiPauseCircle}>
        En pause
      </Badge>
    );
  } else if (inRepeatedErrorState) {
    badge = (
      <Badge variant="destructive" icon={FiAlertTriangle}>
        Erreur
      </Badge>
    );
  } else if (ccPairStatus == ConnectorCredentialPairStatus.SCHEDULED) {
    badge = (
      <Badge variant="not_started" icon={FiClock}>
        Planifié
      </Badge>
    );
  } else if (ccPairStatus == ConnectorCredentialPairStatus.INITIAL_INDEXING) {
    badge = (
      <Badge variant="in_progress" icon={FiClock}>
        Indexation initiale
      </Badge>
    );
  } else if (ccPairStatus == ConnectorCredentialPairStatus.INVALID) {
    badge = (
      <Badge
        tooltip="Le connecteur est dans un état invalide. Veuillez mettre à jour les identifiants ou créer un nouveau connecteur."
        circle
        variant="invalid"
      >
        Invalide
      </Badge>
    );
  } else {
    if (lastIndexAttemptStatus && lastIndexAttemptStatus === "in_progress") {
      badge = (
        <Badge variant="in_progress" icon={FiClock}>
          Indexation
        </Badge>
      );
    } else if (
      lastIndexAttemptStatus &&
      lastIndexAttemptStatus === "not_started"
    ) {
      badge = (
        <Badge variant="not_started" icon={FiClock}>
          Planifié
        </Badge>
      );
    } else if (
      lastIndexAttemptStatus &&
      lastIndexAttemptStatus === "canceled"
    ) {
      badge = (
        <Badge variant="canceled" icon={FiClock}>
          Annulé
        </Badge>
      );
    } else {
      badge = (
        <Badge variant="success" icon={FiCheckCircle}>
          Indexé
        </Badge>
      );
    }
  }

  return <div>{badge}</div>;
}
