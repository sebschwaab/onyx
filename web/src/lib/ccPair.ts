import { ConnectorCredentialPairStatus } from "@/app/admin/connector/[ccPairId]/types";
import { toast } from "@/hooks/useToast";

export async function setCCPairStatus(
  ccPairId: number,
  ccPairStatus: ConnectorCredentialPairStatus,
  onUpdate?: () => void
) {
  try {
    const response = await fetch(
      `/api/manage/admin/cc-pair/${ccPairId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: ccPairStatus }),
      }
    );

    if (!response.ok) {
      const { detail } = await response.json();
      toast.error(`Failed to update connector status - ${detail}`);
      return;
    }

    toast.success(
      ccPairStatus === ConnectorCredentialPairStatus.ACTIVE
        ? "Connecteur activé !"
        : "Connecteur mis en pause !"
    );

    onUpdate && onUpdate();
  } catch (error) {
    console.error("Error updating CC pair status:", error);
    toast.error("Impossible de mettre à jour le statut du connecteur");
  }
}

export const getCCPairStatusMessage = (
  isDisabled: boolean,
  isIndexing: boolean,
  ccPairStatus: ConnectorCredentialPairStatus
) => {
  if (ccPairStatus === ConnectorCredentialPairStatus.INVALID) {
    return "Le connecteur est dans un état invalide. Veuillez mettre à jour les identifiants ou la configuration avant de réindexer.";
  }
  if (ccPairStatus === ConnectorCredentialPairStatus.DELETING) {
    return "Impossible d'indexer pendant la suppression du connecteur";
  }
  if (isIndexing) {
    return "L'indexation est déjà en cours";
  }
  if (isDisabled) {
    return "Le connecteur doit être réactivé avant l'indexation";
  }
  return undefined;
};
